import { NextRequest, NextResponse } from 'next/server';
import shopify from '@/lib/shopify';

export async function GET(request: NextRequest) {
  try {
    const callbackResponse = await shopify.auth.callback({
      rawRequest: request,
      rawResponse: new Response(),
    });

    const { session } = callbackResponse;
    
    if (!session) {
      return NextResponse.json(
        { error: 'No session returned from callback' },
        { status: 500 }
      );
    }

    // Session is automatically stored by sessionStorage
    // Redirect to app after successful auth
    const redirectUrl = new URL('/app', request.url);
    redirectUrl.searchParams.set('shop', session.shop);
    redirectUrl.searchParams.set('host', request.nextUrl.searchParams.get('host') || '');
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.json(
      { error: 'Authentication callback failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

