// api/crawl.js
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const FIRECRAWL_KEY = process.env.FIRECRAWL_KEY;
  if (!FIRECRAWL_KEY) return res.status(500).json({ error: 'Firecrawl key not configured' });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    // Start crawl
    const startRes = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        limit: 20,
        scrapeOptions: { formats: ['markdown'] }
      })
    });
    const startData = await startRes.json();
    if (!startData.id) throw new Error('Failed to start crawl: ' + JSON.stringify(startData));

    // Poll for results
    let result;
    while (true) {
      await new Promise(r => setTimeout(r, 2000));
      const checkRes = await fetch(`https://api.firecrawl.dev/v1/crawl/${startData.id}`, {
        headers: { 'Authorization': `Bearer ${FIRECRAWL_KEY}` }
      });
      result = await checkRes.json();
      if (result.status === 'completed') break;
      if (result.status === 'failed') throw new Error('Crawl failed');
    }

    // Extract markdown
    const pages = (result.data || []).map(page => ({
      url: page.metadata?.sourceURL || page.url,
      content: page.markdown || page.text || ''
    }));

    res.status(200).json({ pages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}