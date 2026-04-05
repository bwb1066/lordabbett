import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

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
        "You are a Lord Abbett brand assistant. Answer questions using information from lordabbett.com. Always cite your sources with links. Include appropriate investment disclaimers when discussing funds or performance.",
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

  // If OpenAI returned an error, pass it through for debugging
  if (data.error) {
    return new Response(JSON.stringify({ text: "", citations: [], debug: data.error }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Extract text and citations from response
  const messageOutput = data.output?.find(
    (o: { type: string }) => o.type === "message"
  );
  let text = "";
  const citations: { url: string; title: string }[] = [];

  if (messageOutput?.content) {
    for (const c of messageOutput.content) {
      if (c.type === "output_text") {
        text += c.text;
        if (c.annotations) {
          for (const a of c.annotations) {
            if (a.type === "url_citation" && a.url) {
              const exists = citations.some((ci) => ci.url === a.url);
              if (!exists) {
                citations.push({ url: a.url, title: a.title || a.url });
              }
            }
          }
        }
      }
    }
  }

  return new Response(JSON.stringify({ text, citations, debug: data.output ? null : data }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
