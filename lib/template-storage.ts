import { promises as fs } from 'fs';
import path from 'path';
import { LabelTemplate } from './types';

const TEMPLATES_DIR = path.join(process.cwd(), 'data', 'templates');

// Ensure templates directory exists
async function ensureTemplatesDir() {
  try {
    await fs.mkdir(TEMPLATES_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

function getTemplateFilePath(id: string): string {
  return path.join(TEMPLATES_DIR, `${id}.json`);
}

export const templateStorage = {
  async listTemplates(): Promise<LabelTemplate[]> {
    try {
      await ensureTemplatesDir();
      const files = await fs.readdir(TEMPLATES_DIR);
      const templates: LabelTemplate[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(TEMPLATES_DIR, file);
          const data = await fs.readFile(filePath, 'utf-8');
          templates.push(JSON.parse(data));
        }
      }

      // Sort by updatedAt descending
      return templates.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Error listing templates:', error);
      return [];
    }
  },

  async getTemplate(id: string): Promise<LabelTemplate | null> {
    try {
      const filePath = getTemplateFilePath(id);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  },

  async saveTemplate(template: Omit<LabelTemplate, 'createdAt' | 'updatedAt'> & { id?: string }): Promise<LabelTemplate> {
    try {
      await ensureTemplatesDir();
      
      const now = new Date().toISOString();
      const id = template.id || `template-${Date.now()}`;
      
      let existingTemplate: LabelTemplate | null = null;
      try {
        existingTemplate = await this.getTemplate(id);
      } catch {
        // Template doesn't exist yet
      }

      const fullTemplate: LabelTemplate = {
        ...template,
        id,
        createdAt: existingTemplate?.createdAt || now,
        updatedAt: now,
      };

      const filePath = getTemplateFilePath(id);
      await fs.writeFile(filePath, JSON.stringify(fullTemplate, null, 2), 'utf-8');
      
      return fullTemplate;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  },

  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const filePath = getTemplateFilePath(id);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  },
};

