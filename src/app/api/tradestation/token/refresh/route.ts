import { authService } from '@/app/api/services/tradestation/authService';

export async function POST(request: Request) {
  try {
    const refreshToken = request.headers.get('Refresh-Token');
    
    if (!refreshToken) {
      return Response.json(
        { error: 'AUTH_NO_REFRESH_TOKEN' },
        { status: 401 }
      );
    }

    const newTokenInfo = await authService.refreshExpiredToken(refreshToken);
    
    return Response.json({
      access_token: newTokenInfo.access_token,
      expires_in: newTokenInfo.expires_in
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to refresh token' },
      { status: 401 }
    );
  }
} 