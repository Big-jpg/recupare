// API Route: app/api/lineage/columns/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';


interface ColumnsRequestBody {
  table: string;
  layer: string;
}

interface Column {
  id: number;
  name: string;
  data_type: string;
  is_key: boolean;
  is_nullable: boolean;
}

interface ColumnsResponse {
  columns: Column[];
  table_name: string;
  layer_name: string;
  total_columns: number;
  error?: string;
}

interface ErrorResponse {
  columns: Column[];
  error: string;
}

const LAYER_MAP = {
  bronze: 1,
  silver: 2,
  gold: 3
} as const;

export async function POST(req: NextRequest): Promise<NextResponse<ColumnsResponse | ErrorResponse>> {
  try {
    console.log('🔍 [COLUMNS API] POST request received');
    
    // Parse request body
    const body = await req.json() as ColumnsRequestBody;
    const { table, layer } = body;

    console.log('📥 [COLUMNS API] Request data:', { table, layer });

    // Validate required parameters
    if (!table) {
      console.error('❌ [COLUMNS API] Missing table parameter');
      return NextResponse.json(
        { columns: [], error: 'Missing "table" parameter in request body' },
        { status: 400 }
      );
    }

    if (!layer) {
      console.error('❌ [COLUMNS API] Missing layer parameter');
      return NextResponse.json(
        { columns: [], error: 'Missing "layer" parameter in request body' },
        { status: 400 }
      );
    }

    // Validate layer value
    if (!Object.keys(LAYER_MAP).includes(layer)) {
      console.error('❌ [COLUMNS API] Invalid layer:', layer);
      return NextResponse.json(
        { columns: [], error: `Invalid layer "${layer}". Must be one of: bronze, silver, gold` },
        { status: 400 }
      );
    }

    const layerId = LAYER_MAP[layer as keyof typeof LAYER_MAP];
    console.log('🎯 [COLUMNS API] Layer mapping:', { layer, layerId });

    // Execute SQL query with proper layer filtering
    console.log('🔍 [COLUMNS API] Executing SQL query...');
    
    const result = await sql`
      SELECT 
        c.id, 
        c.name, 
        c.data_type, 
        c.is_key, 
        c.is_nullable,
        t.name as table_name,
        l.name as layer_name
      FROM columns c
      JOIN tables t ON c.table_id = t.id
      JOIN layers l ON c.layer_id = l.id
      WHERE t.name = ${table} 
        AND l.name = ${layer}
      ORDER BY c.name;
    `;

    console.log('✅ [COLUMNS API] Query executed successfully');
    console.log('📊 [COLUMNS API] Results:', {
      rowCount: result.rows.length,
      table,
      layer,
      layerId
    });

    // Log first few results for debugging
    if (result.rows.length > 0) {
      console.log('📝 [COLUMNS API] Sample results:', result.rows.slice(0, 3));
    }

    // Format response
    const columns = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      data_type: row.data_type,
      is_key: row.is_key,
      is_nullable: row.is_nullable
    }));

    const response: ColumnsResponse = {
      columns,
      table_name: table,
      layer_name: layer,
      total_columns: columns.length
    };

    console.log('🎉 [COLUMNS API] Success response:', {
      columnCount: columns.length,
      tableName: table,
      layerName: layer
    });

    return NextResponse.json(response);

  } catch (err: unknown) {
    console.error('💥 [COLUMNS API] Error:', err);
    
    const error = err instanceof Error ? err.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { columns: [], error: `Database error: ${error}` },
      { status: 500 }
    );
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}