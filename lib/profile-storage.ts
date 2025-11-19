import { promises as fs } from 'fs';
import path from 'path';
import { LabelProfile } from './types';
import { DEFAULT_LABEL_DESIGN } from './label-constants';

const PROFILES_DIR = path.join(process.cwd(), 'data', 'profiles');

// Ensure profiles directory exists
async function ensureProfilesDir() {
  try {
    await fs.mkdir(PROFILES_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

function getProfileFilePath(id: string): string {
  return path.join(PROFILES_DIR, `${id}.json`);
}

export const profileStorage = {
  async listProfiles(): Promise<LabelProfile[]> {
    try {
      await ensureProfilesDir();
      const files = await fs.readdir(PROFILES_DIR);
      const profiles: LabelProfile[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(PROFILES_DIR, file);
          const data = await fs.readFile(filePath, 'utf-8');
          profiles.push(JSON.parse(data));
        }
      }

      // Sort by name
      return profiles.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error listing profiles:', error);
      return [];
    }
  },

  async getProfile(id: string): Promise<LabelProfile | null> {
    try {
      const filePath = getProfileFilePath(id);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  },

  async getDefaultProfile(): Promise<LabelProfile | null> {
    try {
      const profiles = await this.listProfiles();
      return profiles.find(p => p.isDefault) || null;
    } catch (error) {
      return null;
    }
  },

  async saveProfile(profile: Omit<LabelProfile, 'createdAt' | 'updatedAt'> & { id?: string }): Promise<LabelProfile> {
    try {
      await ensureProfilesDir();
      
      const now = new Date().toISOString();
      const id = profile.id || `profile-${Date.now()}`;
      
      let existingProfile: LabelProfile | null = null;
      try {
        existingProfile = await this.getProfile(id);
      } catch {
        // Profile doesn't exist yet
      }

      const fullProfile: LabelProfile = {
        ...profile,
        id,
        createdAt: existingProfile?.createdAt || now,
        updatedAt: now,
      };

      const filePath = getProfileFilePath(id);
      await fs.writeFile(filePath, JSON.stringify(fullProfile, null, 2), 'utf-8');
      
      return fullProfile;
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  },

  async setDefaultProfile(id: string): Promise<boolean> {
    try {
      // Unset all other defaults
      const profiles = await this.listProfiles();
      for (const profile of profiles) {
        if (profile.id !== id && profile.isDefault) {
          await this.saveProfile({ ...profile, isDefault: false });
        }
      }

      // Set this one as default
      const profile = await this.getProfile(id);
      if (profile) {
        await this.saveProfile({ ...profile, isDefault: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting default profile:', error);
      return false;
    }
  },

  async deleteProfile(id: string): Promise<boolean> {
    try {
      const filePath = getProfileFilePath(id);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  },
};

