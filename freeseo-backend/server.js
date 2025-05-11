const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/audit', async (req, res) => {
  const url = req.query.url;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid or missing URL.' });
  }

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Headings check
    const h1s = $('h1');
    const h2s = $('h2');
    const h3s = $('h3');
    const divAsHeading = $('div:header, p:header').length > 0;

    // Image audit
    const images = $('img');
    let missingAlt = 0;
    let badFileNames = 0;
    images.each((_, el) => {
      const alt = $(el).attr('alt');
      const src = $(el).attr('src') || '';
      if (!alt || alt.trim() === '') missingAlt++;
      if (/img\\d+\\.\\w+|image|file|pic/i.test(src)) badFileNames++;
    });

    const result = {
      "Coding Fundamentals": [
        h1s.length === 0
          ? { text: "Missing <h1> tag", status: "fail" }
          : { text: `Found ${h1s.length} <h1> tag(s)`, status: h1s.length === 1 ? "pass" : "warn" },
        h2s.length === 0
          ? { text: "No <h2> tags found", status: "warn" }
          : { text: `Found ${h2s.length} <h2> tag(s)`, status: "pass" },
        divAsHeading
          ? { text: "<div> or <p> used as heading", status: "fail" }
          : { text: "No <div> or <p> used as heading", status: "pass" }
      ],
      "Image Audit": [
        missingAlt > 0
          ? { text: `${missingAlt} image(s) missing alt tags`, status: "fail" }
          : { text: "All images have alt text", status: "pass" },
        badFileNames > 0
          ? { text: `${badFileNames} image(s) with generic filenames`, status: "warn" }
          : { text: "All image filenames are descriptive", status: "pass" }
      ]
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch or parse the website.' });
  }
});

app.listen(PORT, () => {
  console.log(`FreeSEO backend running on port ${PORT}`);
});
