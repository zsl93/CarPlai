import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '20mb',
  },
};

async function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function extractFileFromBuffer(buffer, boundary) {
  const boundaryBuffer = Buffer.from('--' + boundary);
  const parts = [];
  let start = 0;

  while (start < buffer.length) {
    const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
    if (boundaryIndex === -1) break;

    const headerStart = boundaryIndex + boundaryBuffer.length + 2; // skip \r\n
    const headerEnd = buffer.indexOf(Buffer.from('\r\n\r\n'), headerStart);
    if (headerEnd === -1) break;

    const headers = buffer.slice(headerStart, headerEnd).toString();
    const dataStart = headerEnd + 4; // skip \r\n\r\n

    const nextBoundary = buffer.indexOf(boundaryBuffer, dataStart);
    const dataEnd = nextBoundary === -1 ? buffer.length : nextBoundary - 2; // skip \r\n before boundary

    if (headers.includes('filename')) {
      parts.push(buffer.slice(dataStart, dataEnd));
    }

    start = nextBoundary === -1 ? buffer.length : nextBoundary;
  }

  return parts[0] || null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const rawBody = await parseMultipart(req);
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)$/);

    if (!boundaryMatch) {
      return res.status(400).json({ error: 'No boundary found' });
    }

    const boundary = boundaryMatch[1].trim();
    const fileBuffer = extractFileFromBuffer(rawBody, boundary);

    if (!fileBuffer) {
      return res.status(400).json({ error: 'No file found in request' });
    }

    // Convert to JPEG using sharp
    const jpegBuffer = await sharp(fileBuffer)
      .rotate() // auto-rotate based on EXIF
      .jpeg({ quality: 85 })
      .toBuffer();

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', jpegBuffer.length);
    return res.status(200).send(jpegBuffer);

  } catch (e) {
    console.error('HEIC conversion error:', e);
    return res.status(500).json({ error: e.message });
  }
}
