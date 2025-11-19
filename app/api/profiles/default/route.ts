import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { profileStorage } from '@/lib/profile-storage';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated. Please complete OAuth flow.' },
        { status: 401 }
      );
    }

    const profile = await profileStorage.getDefaultProfile();
    
    if (!profile) {
      return NextResponse.json(
        { error: 'No default profile found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Default profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch default profile', details: error instanceof Error ? error.message : 'Unknown error' },
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
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const success = await profileStorage.setDefaultProfile(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const profile = await profileStorage.getProfile(id);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Set default profile error:', error);
    return NextResponse.json(
      { error: 'Failed to set default profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

