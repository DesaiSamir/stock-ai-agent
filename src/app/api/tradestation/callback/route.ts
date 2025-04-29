import { authService } from '@/app/api/services/tradestation/authService';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    const url = new URL(request.url);
    const host = url.host || 'localhost:3000';
    
    if (!code) {
      return Response.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    console.log('Exchanging code for token...');
    const tokenInfo = await authService.exchangeCodeForToken(code, host);
    
    if (!tokenInfo?.access_token) {
      return Response.json(
        { error: 'Failed to obtain access token' },
        { status: 400 }
      );
    }

    console.log('Token obtained successfully');
    
    // Return the token info to the client
    return Response.json({
      access_token: tokenInfo.access_token,
      refresh_token: tokenInfo.refresh_token,
      expires_in: tokenInfo.expires_in,
      profile: {
        userid: tokenInfo.userid,
        // Add any other profile info you need
      }
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to exchange code for token' },
      { status: 500 }
    );
  }
} 