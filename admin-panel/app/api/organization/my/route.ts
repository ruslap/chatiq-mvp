import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return a mock organization ID from localStorage fallback
    // This allows the app to work without full authentication
    const mockOrgId = "8df94c53-1364-4bbd-99a4-f9a0ffb01f9a";
    
    return NextResponse.json({
      organizationId: mockOrgId,
      settings: {
        organizationId: mockOrgId,
        color: "#6366F1",
        operatorName: "Support Team"
      }
    });
    
  } catch (error) {
    console.error('Error in organization API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
