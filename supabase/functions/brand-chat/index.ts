import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface Citation {
  url: string;
  title: string;
  description: string;
  image: string;
}

async function fetchMeta(url: string): Promise<{ description: string; image: string }> {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    const html = await resp.text();

    const getTag = (name: string): string => {
      const re = new RegExp(
        `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']`,
        "i"
      );
      const re2 = new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${name}["']`,
        "i"
      );
      return re.exec(html)?.[1] || re2.exec(html)?.[1] || "";
    };

    const description = getTag("og:description") || getTag("description");
    const image = getTag("og:image");

    return { description, image };
  } catch {
    return { description: "", image: "" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers":
          "authorization, content-type, apikey, x-client-info",
      },
    });
  }

  const { message } = await req.json();

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1",
      instructions:
        "You are a Lord Abbett brand assistant. Answer questions using information from lordabbett.com. Always cite your sources with links. Include appropriate investment disclaimers when discussing funds or performance. At the end of every response, suggest 2-3 related follow-up questions the user might want to ask. Format them on separate lines prefixed with 'SUGGESTED:' (e.g. 'SUGGESTED: What are Lord Abbett's fixed income strategies?'). These must be the very last lines of your response.",
      input: message,
      tools: [
        {
          type: "web_search",
          filters: {
            allowed_domains: ["lordabbett.com"],
          },
        },
      ],
      include: ["web_search_call.action.sources"],
    }),
  });

  const data = await response.json();

  if (data.error) {
    return new Response(
      JSON.stringify({ text: "", citations: [], debug: data.error }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // Extract text and unique citation URLs
  const messageOutput = data.output?.find(
    (o: { type: string }) => o.type === "message"
  );
  let text = "";
  const urlMap = new Map<string, string>();

  if (messageOutput?.content) {
    for (const c of messageOutput.content) {
      if (c.type === "output_text") {
        text += c.text;
        if (c.annotations) {
          for (const a of c.annotations) {
            if (a.type === "url_citation" && a.url && !urlMap.has(a.url)) {
              urlMap.set(a.url, a.title || a.url);
            }
          }
        }
      }
    }
  }

  // Fetch metadata for each citation in parallel
  // Strip utm params from citation URLs
  const cleanUrl = (u: string): string => {
    try {
      const parsed = new URL(u);
      [...parsed.searchParams.keys()]
        .filter((k) => k.startsWith("utm_"))
        .forEach((k) => parsed.searchParams.delete(k));
      return parsed.toString();
    } catch {
      return u;
    }
  };

  // Dedupe again after cleaning URLs
  const cleanMap = new Map<string, string>();
  for (const [url, title] of urlMap) {
    const clean = cleanUrl(url);
    if (!cleanMap.has(clean)) cleanMap.set(clean, title);
  }

  const citationEntries = [...cleanMap.entries()];
  const metaResults = await Promise.all(
    citationEntries.map(([url]) => fetchMeta(url))
  );

  const citations: Citation[] = citationEntries.map(([url, title], i) => ({
    url,
    title,
    description: metaResults[i].description,
    image: metaResults[i].image,
  }));

  // Extract suggested follow-up questions
  const suggestions: string[] = [];
  const lines = text.split("\n");
  const cleanLines: string[] = [];

  // Find trailing question lines (with or without SUGGESTED: prefix)
  // Work backwards from the end to find consecutive question lines
  const reversedLines = [...lines].reverse();
  const trailingQuestions: number[] = [];
  for (let i = 0; i < reversedLines.length; i++) {
    const trimmed = reversedLines[i].trim();
    if (!trimmed) continue; // skip blank lines
    if (
      trimmed.startsWith("SUGGESTED:") ||
      (trimmed.endsWith("?") && trimmed.length > 20)
    ) {
      trailingQuestions.push(lines.length - 1 - i);
    } else {
      break; // stop at first non-question line
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trailingQuestions.includes(i)) {
      const q = trimmed
        .replace(/^SUGGESTED:\s*/, "")
        .replace(/^[-–•*]\s*/, "")
        .replace(/^\*\*(.+)\*\*$/, "$1");
      if (q) suggestions.push(q);
    } else {
      cleanLines.push(lines[i]);
    }
  }
  text = cleanLines.join("\n").trimEnd();

  // Strip utm params from any URLs in the text
  text = text.replace(
    /https?:\/\/[^\s)>\]]+/g,
    (match) => cleanUrl(match),
  );

  return new Response(
    JSON.stringify({
      text, citations, suggestions, debug: data.output ? null : data,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
});
