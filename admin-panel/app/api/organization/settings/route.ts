import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await request.json();

    // Get the API URL from environment or fallback to localhost
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Create headers without accessToken since NextAuth doesn't provide it by default
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if accessToken is available
    if (session.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }
    
    // Forward the request to the backend API
    const response = await fetch(`${apiUrl}/organization/settings`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error in organization settings API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
