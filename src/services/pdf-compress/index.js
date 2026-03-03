const { Router } = require('express');
const { compressPdf } = require('./ghostscript');

const router = Router();

function qualityToPreset(quality) {
  if (quality <= 25) return 'screen';
  if (quality <= 50) return 'ebook';
  if (quality <= 75) return 'printer';
  return 'prepress';
}

router.post('/compress', async (req, res, next) => {
  try {
    const { file, quality = 50 } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'Missing "file" field (base64 PDF)' });
    }

    const q = Number(quality);
    if (!Number.isInteger(q) || q < 1 || q > 100) {
      return res.status(400).json({ error: 'quality must be an integer between 1 and 100' });
    }

    const compressed = await compressPdf(file, qualityToPreset(q));

    res.json({ file: compressed });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
