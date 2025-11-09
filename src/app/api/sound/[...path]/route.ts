import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: { path?: string[] } }) {
  try {
    const segments = params?.path ?? [];
    if (!segments || segments.length === 0) return new NextResponse('Not found', { status: 404 });

    // root of asset folder in repo
    const root = path.join(process.cwd(), 'asset', 'sound');
    // Prevent path traversal
    const safePath = path.join(root, ...segments);
    if (!safePath.startsWith(root)) return new NextResponse('Forbidden', { status: 403 });

    const buf = await fs.readFile(safePath);
    const ext = path.extname(safePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.mp3') contentType = 'audio/mpeg';
    if (ext === '.wav') contentType = 'audio/wav';
    if (ext === '.ogg') contentType = 'audio/ogg';

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
