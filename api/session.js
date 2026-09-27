// Creates a new chat session with the Meskel Agent.
// The agent's API key stays server-side (MESKEL_AGENT_KEY env var) and is
// never sent to the browser.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.MESKEL_AGENT_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Chat is not configured on this server.' });
    return;
  }

  try {
    const upstream = await fetch('https://agenthub.smartschema.io/api/public/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Website visitor chat' }),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Could not reach the chat service.' });
  }
}
