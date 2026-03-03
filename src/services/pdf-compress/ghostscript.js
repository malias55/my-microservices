const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const execFileAsync = promisify(execFile);

async function compressPdf(base64Input, quality) {
  const id = crypto.randomUUID();
  const inputPath = path.join('/tmp', `${id}-input.pdf`);
  const outputPath = path.join('/tmp', `${id}-output.pdf`);

  try {
    const buffer = Buffer.from(base64Input, 'base64');
    await fs.writeFile(inputPath, buffer);

    await execFileAsync('gs', [
      '-q',
      '-dNOPAUSE',
      '-dBATCH',
      '-dSAFER',
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=/${quality}`,
      '-dEmbedAllFonts=true',
      '-dSubsetFonts=true',
      `-sOutputFile=${outputPath}`,
      inputPath
    ], { timeout: 60000 });

    const compressed = await fs.readFile(outputPath);
    return compressed.toString('base64');
  } finally {
    await Promise.allSettled([
      fs.unlink(inputPath),
      fs.unlink(outputPath)
    ]);
  }
}

module.exports = { compressPdf };
