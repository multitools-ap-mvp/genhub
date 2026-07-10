export async function onRequestPost({ request, env }) {
  try {
    // 1. Get the payload sent from your frontend
    const { prompt } = await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400 });
    }

    // 2. Grab your secure API key from Cloudflare's Environment Variables
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key not configured on server" }), { status: 500 });
    }

    // 3. Forward the request to the Google Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;
    const payload = {
      instances: [{ prompt: prompt }],
      parameters: { sampleCount: 1, outputOptions: { mimeType: "image/png" } }
    };

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return new Response(JSON.stringify(data), { status: geminiResponse.status });
    }

    // 4. Send the result back to your frontend
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
