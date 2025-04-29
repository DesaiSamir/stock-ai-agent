import { authService } from '@/app/api/services/tradestation/authService';

export async function POST(request: Request) {
  try {
    const validatedHeaders = await authService.validateAndRefreshTokens(request.headers);
    
    return Response.json({
      access_token: validatedHeaders.authorization.replace('Bearer ', ''),
      refresh_token: validatedHeaders.refreshToken,
      expires_in: validatedHeaders.expiresIn
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to refresh token' },
      { status: 401 }
    );
  }
} 