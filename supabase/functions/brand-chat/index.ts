import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const VECTOR_STORE_ID = "vs_69cd66f34ff08191b5fac052755f7cb5";

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
        "You are a Lord Abbett brand assistant. Only answer based on the provided documents. If you cannot find the answer, say so. Include appropriate investment disclaimers.",
      input: message,
      tools: [
        {
          type: "file_search",
          vector_store_ids: [VECTOR_STORE_ID],
          max_num_results: 5,
        },
      ],
    }),
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
