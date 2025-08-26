// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Test database connection
    let databaseConnected = false;
    let userCount = 0;
    
    try {
      const { rows } = await sql`SELECT COUNT(*) as count FROM users`;
      databaseConnected = true;
      userCount = parseInt(rows[0].count);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      databaseConnected = false;
    }

    // Check OpenAI Agents availability
    const openaiAgentsReady = !!process.env.OPENAI_API_KEY;

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      database: { connected: databaseConnected, userCount },
      services: { openaiAgents: openaiAgentsReady },
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      timestamp: new Date().toISOString(),
      database: { connected: false, userCount: 0 },
      services: { openaiAgents: false },
      error: (e as Error).message,
    }, { status: 200 });
  }
}

