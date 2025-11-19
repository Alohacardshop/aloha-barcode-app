import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { templateStorage } from '@/lib/template-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated. Please complete OAuth flow.' },
        { status: 401 }
      );
    }

    const template = await templateStorage.getTemplate(params.id);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Template API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

