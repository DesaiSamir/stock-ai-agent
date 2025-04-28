class TradestationService {
  private getHeaders(headers: Headers) {
    const authHeader = headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    };
  }

  async get(url: string, headers: Headers) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(headers)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('TradeStation API request failed:', error);
      throw error;
    }
  }

  async post(url: string, data: unknown, headers: Headers) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(headers),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('TradeStation API request failed:', error);
      throw error;
    }
  }
}

export const tradestationService = new TradestationService(); 