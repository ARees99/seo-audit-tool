const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/audit', async (req, res) => {
  const { url } = req.body;
  try {
    const response = await fetch(url);
    const html = await response.text();
    const h1Count = (html.match(/<h1[\s\S]*?>/gi) || []).length;
    const missingAlt = (html.match(/<img(?![^>]*alt=)/gi) || []).length;
    const hasMetaDesc = /<meta\s+name=["']description["']/i.test(html);
    const titleTag = html.match(/<title>(.*?)<\/title>/i);
    res.json({
      url,
      h1Count,
      missingAlt,
      missingMetaDescription: !hasMetaDesc,
      titleTagPresent: !!titleTag,
      titleTagLength: titleTag ? titleTag[1].length : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Audit failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running at http://localhost:' + PORT));