import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

interface TableRow {
  id: number;
  name: string;
  description: string;
  layer: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const layer = searchParams.get('layer');

  try {
    let result;

    if (layer) {
      result = await sql<TableRow>`
        SELECT t.id, t.name, t.description, l.name as layer
        FROM tables t
        JOIN layers l ON t.layer_id = l.id
        WHERE l.name = ${layer}
        ORDER BY l.name, t.name;
      `;
    } else {
      result = await sql<TableRow>`
        SELECT t.id, t.name, t.description, l.name as layer
        FROM tables t
        JOIN layers l ON t.layer_id = l.id
        ORDER BY l.name, t.name;
      `;
    }

    return NextResponse.json({ tables: result.rows });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    console.error('[FETCH TABLES ERROR]', err);
    return NextResponse.json({ tables: [], error });
  }
}
