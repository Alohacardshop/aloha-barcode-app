import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { templateStorage } from '@/lib/template-storage';
import { LabelTemplate } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated. Please complete OAuth flow.' },
        { status: 401 }
      );
    }

    const templates = await templateStorage.listTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Templates API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated. Please complete OAuth flow.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, design } = body;

    if (!name || !design) {
      return NextResponse.json(
        { error: 'Missing required fields: name, design' },
        { status: 400 }
      );
    }

    const template = await templateStorage.saveTemplate({
      id,
      name,
      design,
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Template save error:', error);
    return NextResponse.json(
      { error: 'Failed to save template', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

