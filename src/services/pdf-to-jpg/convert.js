const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const execFileAsync = promisify(execFile);

// Rendering tuned for a readable but compact result.
const MAX_PAGES = 10;       // pages beyond this are silently dropped
const DPI = 150;            // render resolution
const JPEG_QUALITY = 78;    // output JPEG quality (1-100)

/**
 * Render up to MAX_PAGES of a PDF to JPEGs and stitch them top-to-bottom
 * into a single optimized JPEG. Returns a Buffer.
 */
async function pdfToJpg(pdfBuffer) {
  const workDir = path.join(os.tmpdir(), crypto.randomUUID());
  const inputPath = path.join(workDir, 'input.pdf');
  const pagePattern = path.join(workDir, 'page-%03d.jpg');
  const outputPath = path.join(workDir, 'output.jpg');

  await fs.mkdir(workDir, { recursive: true });

  try {
    await fs.writeFile(inputPath, pdfBuffer);

    // Render the first MAX_PAGES pages to individual JPEGs. -dLastPage caps
    // the page count, so PDFs with more pages are simply truncated.
    await execFileAsync('gs', [
      '-q',
      '-dNOPAUSE',
      '-dBATCH',
      '-dSAFER',
      '-sDEVICE=jpeg',
      `-r${DPI}`,
      `-dJPEGQ=${JPEG_QUALITY}`,
      '-dFirstPage=1',
      `-dLastPage=${MAX_PAGES}`,
      '-dTextAlphaBits=4',
      '-dGraphicsAlphaBits=4',
      `-sOutputFile=${pagePattern}`,
      inputPath,
    ], { timeout: 120000 });

    // Collect rendered pages in page order.
    const pageFiles = (await fs.readdir(workDir))
      .filter((f) => /^page-\d+\.jpg$/.test(f))
      .sort()
      .map((f) => path.join(workDir, f));

    if (pageFiles.length === 0) {
      const err = new Error('No pages could be rendered from the PDF');
      err.status = 422;
      throw err;
    }

    // Stack pages vertically and optimize. Works for a single page too.
    await execFileAsync('convert', [
      ...pageFiles,
      '-background', 'white',
      '-gravity', 'center',
      '-append',
      '-quality', String(JPEG_QUALITY),
      '-strip',
      '-interlace', 'Plane',
      outputPath,
    ], { timeout: 120000 });

    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

module.exports = { pdfToJpg, MAX_PAGES, DPI, JPEG_QUALITY };
