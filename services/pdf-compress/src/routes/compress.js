const { Router } = require('express');
const { compressPdf } = require('../lib/ghostscript');

const router = Router();

const VALID_QUALITIES = ['screen', 'ebook', 'printer', 'prepress'];

router.post('/compress', async (req, res, next) => {
  try {
    const { file, quality = 'ebook' } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'Missing "file" field (base64 PDF)' });
    }

    if (!VALID_QUALITIES.includes(quality)) {
      return res.status(400).json({
        error: `Invalid quality. Must be one of: ${VALID_QUALITIES.join(', ')}`
      });
    }

    const compressed = await compressPdf(file, quality);

    res.json({ file: compressed });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
