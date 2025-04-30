import { tradestationConfig } from './config';

interface TokenInfo {
  access_token: string;
  expires_in: number;
  userid: string;
  [key: string]: unknown;
}

export interface AuthHeaders {
  authorization: string;
  expiresIn: number;
}

class AuthService {
  private static instance: AuthService;
  private tokenInfo: TokenInfo | null = null;
  private expiresAt: Date | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private getRedirectUri(host: string): string {
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    return `${protocol}://${host}${tradestationConfig.apiCallback}`;
  }

  async exchangeCodeForToken(code: string, host: string): Promise<TokenInfo> {
    const payload = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.getRedirectUri(host),
      client_id: tradestationConfig.clientId,
      client_secret: tradestationConfig.clientSecret
    });

    const response = await fetch(`${tradestationConfig.baseUrlSim}/v2/Security/Authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    const tokenInfo: TokenInfo = await response.json();
    this.updateTokenInfo(tokenInfo);
    return tokenInfo;
  }

  async refreshExpiredToken(refreshToken: string): Promise<TokenInfo> {
    const payload = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: tradestationConfig.clientId,
      client_secret: tradestationConfig.clientSecret
    });

    const response = await fetch(`${tradestationConfig.baseUrlSim}/v2/Security/Authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to refresh token:', error);
      throw new Error('AUTH_REFRESH_FAILED');
    }

    const tokenInfo: TokenInfo = await response.json();
    this.updateTokenInfo(tokenInfo);
    return tokenInfo;
  }

  private updateTokenInfo(tokenInfo: TokenInfo): void {
    if (tokenInfo.access_token) {
      this.tokenInfo = tokenInfo;
      this.expiresAt = new Date(Date.now() + tokenInfo.expires_in * 1000);
    }
  }

  getTokenInfo(): TokenInfo | null {
    return this.tokenInfo;
  }

  isAuthenticated(): boolean {
    return !!this.tokenInfo && !!this.expiresAt && this.expiresAt.getTime() > Date.now();
  }
}

export const authService = AuthService.getInstance(); 