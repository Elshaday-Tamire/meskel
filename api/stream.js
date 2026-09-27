// Proxies a chat message to the Meskel Agent and streams the response
// straight back to the browser as Server-Sent Events. Runs on the Edge
// runtime so the upstream stream can be piped through without buffering.
// The agent's API key stays server-side (MESKEL_AGENT_KEY env var).
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.MESKEL_AGENT_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Chat is not configured on this server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sessionId = new URL(req.url).searchParams.get('session_id');
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing session_id.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (typeof body.message !== 'string' || !body.message.trim()) {
    return new Response(JSON.stringify({ error: 'Missing message.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const upstream = await fetch(
    `https://agenthub.smartschema.io/api/public/sessions/${encodeURIComponent(sessionId)}/stream`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: body.message, filter_vars: {} }),
    }
  );

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
