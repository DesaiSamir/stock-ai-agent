import { tradestationConfig } from './config';

interface TokenInfo {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  userid: string;
  [key: string]: unknown;
}

class AuthService {
  private static instance: AuthService;
  private tokenInfo: TokenInfo | null = null;
  private refreshedAt: Date | null = null;
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

  async refreshToken(): Promise<TokenInfo> {
    if (!this.tokenInfo?.refresh_token) {
      throw new Error('No refresh token available');
    }

    const payload = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.tokenInfo.refresh_token,
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
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const tokenInfo: TokenInfo = await response.json();
    this.updateTokenInfo(tokenInfo);
    return tokenInfo;
  }

  private updateTokenInfo(tokenInfo: TokenInfo): void {
    if (tokenInfo.access_token) {
      this.tokenInfo = tokenInfo;
      this.refreshedAt = new Date();
      this.expiresAt = new Date(Date.now() + tokenInfo.expires_in * 1000);
    }
  }

  async getValidToken(): Promise<string> {
    if (!this.tokenInfo || !this.expiresAt) {
      throw new Error('No token available');
    }

    // Refresh token if it expires in less than 5 minutes
    if (this.expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
      await this.refreshToken();
    }

    return this.tokenInfo.access_token;
  }

  getTokenInfo(): TokenInfo | null {
    return this.tokenInfo;
  }

  isAuthenticated(): boolean {
    return !!this.tokenInfo && !!this.expiresAt && this.expiresAt.getTime() > Date.now();
  }
}

export const authService = AuthService.getInstance(); 