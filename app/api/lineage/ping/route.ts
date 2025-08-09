// /app/api/lineage/ping/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, message: 'Lineage API is reachable ✅' });
}
