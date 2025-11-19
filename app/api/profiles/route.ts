import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { profileStorage } from '@/lib/profile-storage';
import { LabelProfile } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated. Please complete OAuth flow.' },
        { status: 401 }
      );
    }

    const profiles = await profileStorage.listProfiles();
    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Profiles API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles', details: error instanceof Error ? error.message : 'Unknown error' },
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
    const { id, name, description, design, isDefault } = body;

    if (!name || !design) {
      return NextResponse.json(
        { error: 'Missing required fields: name, design' },
        { status: 400 }
      );
    }

    const profile = await profileStorage.saveProfile({
      id,
      name,
      description,
      design,
      isDefault: isDefault || false,
    });

    // If this is set as default, update all others
    if (isDefault) {
      await profileStorage.setDefaultProfile(profile.id);
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile save error:', error);
    return NextResponse.json(
      { error: 'Failed to save profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

