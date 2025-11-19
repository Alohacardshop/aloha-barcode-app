import { NextRequest } from 'next/server';
import shopify from './shopify';

export async function getSessionFromRequest(request: NextRequest) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop') || 
               request.headers.get('x-shopify-shop-domain') ||
               request.headers.get('shop');
  
  if (!shop) {
    return null;
  }

  // Try to load session by shop
  // For offline tokens, we use the shop domain as part of the session ID
  const sessionId = shopify.session.getOfflineId(shop);
  const session = await shopify.config.sessionStorage.loadSession(sessionId);
  
  return session;
}

export async function requireAuth(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  
  if (!session || !session.accessToken) {
    return null;
  }
  
  return session;
}

