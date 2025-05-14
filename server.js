const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.post('/api/audit', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const response = await fetch(url);
    const html = await response.text();
    const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
    const missingAlt = (html.match(/<img[^>]+(?<!alt=["'][^"']*)>/gi) || []).length;

    res.json({
      url,
      h1Count: h1Matches.length,
      imagesMissingAlt: missingAlt,
      length: html.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch or parse HTML' });
  }
});

app.listen(PORT, () => {
  console.log(`FreeSEO backend running on port ${PORT}`);
});
