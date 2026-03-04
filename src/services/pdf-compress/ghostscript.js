const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const execFileAsync = promisify(execFile);

const COLOR_ARGS = {
  grayscale: ['-sColorConversionStrategy=Gray', '-dProcessColorModel=/DeviceGray'],
  bw: ['-sColorConversionStrategy=Gray', '-dProcessColorModel=/DeviceGray', '-dMonoImageResolution=300', '-dConvertCMYKImagesToRGB=true'],
};

async function compressPdf(base64Input, quality, colorMode) {
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
      ...(colorMode && COLOR_ARGS[colorMode] || []),
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
