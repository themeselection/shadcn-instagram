import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Only proxy images from trusted Instagram CDN hostnames
const ALLOWED_HOSTS = [
  'instagram.famd12-1.fna.fbcdn.net',
  'instagram.fblr1-1.fna.fbcdn.net',
  'scontent.cdninstagram.com',
  'scontent-sin6-3.cdninstagram.com',
  'cdninstagram.com'
];

function isAllowed(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith('.' + h) || hostname.endsWith('fbcdn.net') || hostname.endsWith('cdninstagram.com'));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  if (!isAllowed(imageUrl)) {
    return new NextResponse('URL not allowed', { status: 403 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        // Mimic a browser request so Instagram CDN serves the image
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        Referer: 'https://www.instagram.com/'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache on CDN/browser for 1 hour — Instagram URLs expire anyway
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
        // Allow cross-origin so the widget JS (any origin) can load images
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch {
    return new NextResponse('Proxy error', { status: 500 });
  }
}
