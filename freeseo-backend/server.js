const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

function calculateScore(metrics) {
  const total = metrics.length;
  const passed = metrics.filter(m => m.status === 'pass').length;
  return Math.round((passed / total) * 100);
}

app.get('/audit', async (req, res) => {
  const url = req.query.url;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid or missing URL.' });
  }

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Heading checks
    const h1s = $('h1').toArray().map(el => $(el).text().trim()).filter(Boolean);
    const h2s = $('h2').toArray().map(el => $(el).text().trim()).filter(Boolean);
    const h3s = $('h3').toArray().map(el => $(el).text().trim()).filter(Boolean);
    const divAsHeading = $('div:header, p:header').length > 0;

    // Image audit
    const images = $('img');
    let missingAlt = [];
    let badFileNames = [];

    images.each((_, el) => {
      const alt = $(el).attr('alt');
      const src = $(el).attr('src') || '';
      const fullSrc = src.startsWith('http') ? src : new URL(src, url).href;

      if (!alt || alt.trim() === '') missingAlt.push(fullSrc);
      if (/img\d+\.\w+|image|file|pic/i.test(src)) badFileNames.push(fullSrc);
    });

    const codingFundamentals = [
      h1s.length === 0
        ? { text: "No <h1> tag found", status: "fail" }
        : { text: `Found ${h1s.length} <h1> tag(s): ${h1s.join('; ')}`, status: h1s.length === 1 ? "pass" : "warn" },
      h2s.length === 0
        ? { text: "No <h2> tags found", status: "warn" }
        : { text: `Found ${h2s.length} <h2> tag(s): ${h2s.slice(0, 5).join('; ')}${h2s.length > 5 ? '...' : ''}`, status: "pass" },
      divAsHeading
        ? { text: "<div> or <p> used as heading", status: "fail" }
        : { text: "No <div> or <p> used as heading", status: "pass" }
    ];

    const imageAudit = [
      missingAlt.length > 0
        ? { text: `${missingAlt.length} image(s) missing alt tags`, status: "fail", links: missingAlt }
        : { text: "All images have alt text", status: "pass", links: [] },
      badFileNames.length > 0
        ? { text: `${badFileNames.length} image(s) with generic filenames`, status: "warn", links: badFileNames }
        : { text: "All image filenames are descriptive", status: "pass", links: [] }
    ];

    const scores = {
      SEO: calculateScore([codingFundamentals[0], imageAudit[0], imageAudit[1]]),
      Accessibility: calculateScore([imageAudit[0]]),
      Structure: calculateScore(codingFundamentals)
    };

    const result = {
      scores,
      "Coding Fundamentals": codingFundamentals,
      "Image Audit": imageAudit
    };

    res.json(result);
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Failed to fetch or parse the website.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ FreeSEO backend running on port ${PORT}`);
});
