const { Router } = require('express');
const express = require('express');
const { pdfToJpg } = require('./convert');

const router = Router();

// Accept a raw binary PDF body. type: () => true means the body is buffered
// regardless of Content-Type (the global JSON parser leaves non-JSON bodies
// untouched, so the stream is still available here).
router.post(
  '/convert-to-jpg',
  express.raw({ type: () => true, limit: '50mb' }),
  async (req, res, next) => {
    try {
      const pdf = req.body;

      if (!Buffer.isBuffer(pdf) || pdf.length === 0) {
        return res.status(400).json({ error: 'Request body must contain a binary PDF' });
      }

      if (pdf.subarray(0, 5).toString('latin1') !== '%PDF-') {
        return res.status(400).json({ error: 'Request body is not a valid PDF' });
      }

      const jpg = await pdfToJpg(pdf);

      res.type('image/jpeg').send(jpg);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
