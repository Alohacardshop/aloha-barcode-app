import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION, Session } from '@shopify/shopify-api';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-01';
import { sessionStorage } from './session-storage';

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SCOPES?.split(',') || ['read_products'],
  hostName: process.env.HOST?.replace('https://', '').replace('http://', '').split(':')[0] || 'localhost',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  restResources,
  sessionStorage: {
    async storeSession(session: Session) {
      return await sessionStorage.storeSession(session);
    },
    async loadSession(id: string) {
      return await sessionStorage.loadSession(id);
    },
    async deleteSession(id: string) {
      return await sessionStorage.deleteSession(id);
    },
    async deleteSessions(ids: string[]) {
      return await sessionStorage.deleteSessions(ids);
    },
  },
});

export { shopify };
export default shopify;

