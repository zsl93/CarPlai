export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;
    const model = body.model;
    const key = body.key;
    const geminiKey = (key && key.trim()) ? key.trim() : process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return res.status(400).json({ error: { message: 'No Gemini API key. Tap API KEY in the app to add yours.' } });
    }

    const geminiBody = {
      contents: body.contents,
      generationConfig: body.generationConfig,
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } }
};
