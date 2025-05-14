const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

app.get('/api/audit', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing URL param' });

  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    const h1Count = $('h1').length;
    const missingAlt = $('img:not([alt])').length;
    const titleTag = $('title').text();
    const metaDescription = $('meta[name="description"]').attr('content');

    res.json({
      h1Count,
      missingAlt,
      titleTagPresent: !!titleTag,
      titleTagLength: titleTag.length,
      metaDescriptionPresent: !!metaDescription,
      metaDescriptionLength: metaDescription?.length || 0,
      htmlStructureIssues: h1Count === 0 ? ["No H1 tag"] : [],
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch or parse the URL' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
