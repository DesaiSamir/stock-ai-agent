import { NextResponse } from 'next/server';
import { aiService } from '../../services/ai/aiService';

export async function GET() {
  try {
    const healthStatus = await aiService.healthCheck();
    
    return NextResponse.json(
      healthStatus,
      { 
        status: healthStatus.status === 'healthy' ? 200 : 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Health check failed unexpectedly',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 