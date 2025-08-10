// app/api/health/route.ts
import { NextResponse } from 'next/server';
// import your db client if you have one

export async function GET() {
  try {
    // Example checks (replace with real):
    const databaseConnected = true; // await db.ping()
    const openaiAgentsReady = true; // await agents.ping()

    return NextResponse.json({
      ok: true,
      database: { connected: databaseConnected, userCount: 0 },
      services: { openaiAgents: openaiAgentsReady },
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      database: { connected: false, userCount: 0 },
      services: { openaiAgents: false },
      error: (e as Error).message,
    }, { status: 200 });
  }
}
