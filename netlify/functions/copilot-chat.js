/**
 * netlify/functions/copilot-chat.js
 * Serverless proxy for OpenRouter AI Copilot+ Agent
 * Primary Model: nvidia/nemotron-3-ultra-550b-a55b + automatic multi-model fallback
 * Endpoint: POST https://openrouter.ai/api/v1/chat/completions
 */
const DEFAULT_OR_KEY = process.env.OPENROUTER_API_KEY || "";
const FALLBACK_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
  "nvidia/llama-3.3-nemotron-super-49b-v1:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "openrouter/free",
  "openrouter/auto"
];

exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: { code: 405, message: "Method Not Allowed" } }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const apiKey = body.apiKey || DEFAULT_OR_KEY;

    if (!apiKey) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          choices: [{
            message: {
              role: "assistant",
              content: "Probaho Copilot is operating in secure local simulation mode. To enable external cloud AI models, configure `OPENROUTER_API_KEY` in Netlify Environment Variables."
            }
          }]
        })
      };
    }
    const requestedModel = body.model || FALLBACK_MODELS[0];
    const modelsToTry = [requestedModel].concat(FALLBACK_MODELS.filter(m => m !== requestedModel));

    let lastStatus = 502;
    let lastText = JSON.stringify({ error: { code: 502, message: "All upstream models busy" } });

    for (const modelSlug of modelsToTry) {
      const payload = {
        model: modelSlug,
        messages: Array.isArray(body.messages) ? body.messages : [{ role: "user", content: String(body.prompt || "Hello") }],
        temperature: typeof body.temperature === "number" ? body.temperature : 0.3,
        max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 900
      };

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://probaho-remit.netlify.app",
          "X-Title": "Probaho Remit — Titan Edition Copilot+"
        },
        body: JSON.stringify(payload)
      });

      lastStatus = res.status;
      lastText = await res.text();
      if (res.ok) {
        return { statusCode: 200, headers, body: lastText };
      }
    }

    return { statusCode: lastStatus, headers, body: lastText };
  } catch (err) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: { code: 502, message: err.message || "Upstream OpenRouter request failed" } })
    };
  }
};
