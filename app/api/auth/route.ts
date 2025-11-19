import { NextRequest, NextResponse } from 'next/server';
import shopify from '@/lib/shopify';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shop = searchParams.get('shop');
  const host = searchParams.get('host');

  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  try {
    const authRoute = await shopify.auth.begin({
      shop,
      callbackPath: '/api/auth/callback',
      isOnline: false,
      rawRequest: request,
      rawResponse: new Response(),
    });

    return NextResponse.redirect(authRoute);
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Handle OAuth callback
  try {
    const callbackResponse = await shopify.auth.callback({
      rawRequest: request,
      rawResponse: new Response(),
    });

    // The callback returns a CallbackResponse, not a session directly
    // In production, you'd store the session from callbackResponse.session
    return NextResponse.json({ 
      success: true, 
      message: 'Authentication successful'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

