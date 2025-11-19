import { Session } from '@shopify/shopify-api';
import { promises as fs } from 'fs';
import path from 'path';

const SESSIONS_DIR = path.join(process.cwd(), '.sessions');

// Ensure sessions directory exists
async function ensureSessionsDir() {
  try {
    await fs.mkdir(SESSIONS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

function getSessionFilePath(id: string): string {
  return path.join(SESSIONS_DIR, `${id}.json`);
}

export const sessionStorage = {
  async storeSession(session: Session): Promise<boolean> {
    try {
      await ensureSessionsDir();
      const filePath = getSessionFilePath(session.id);
      await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('Error storing session:', error);
      return false;
    }
  },

  async loadSession(id: string): Promise<Session | undefined> {
    try {
      const filePath = getSessionFilePath(id);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as Session;
    } catch (error) {
      // Session doesn't exist
      return undefined;
    }
  },

  async deleteSession(id: string): Promise<boolean> {
    try {
      const filePath = getSessionFilePath(id);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  },

  async deleteSessions(ids: string[]): Promise<boolean> {
    try {
      await Promise.all(ids.map(id => this.deleteSession(id)));
      return true;
    } catch (error) {
      return false;
    }
  },
};

