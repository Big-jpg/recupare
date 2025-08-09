// Corrected Transformations API Route - Fixed SQL Schema
// app/api/lineage/transformations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// =============================================================================
// Type Definitions
// =============================================================================

interface Transformation {
  id: number;
  name: string;
  description: string;
  source_table: string;
  target_table: string;
  source_layer: string;
  target_layer: string;
  transformation_type: string;
  confidence_score?: number;
  created_at: string;
  script?: string;
  status?: string;
}

interface TransformationSummary {
  total: number;
  table_name: string;
  layers_involved: string[];
  avg_confidence: number;
}

interface TransformationResponse {
  transformations: Transformation[];
  summary: TransformationSummary;
  error?: string;
}

interface TransformationRequestBody {
  table_name?: string;
  table_id?: number;
  source_layer?: string;
  target_layer?: string;
  direction?: 'upstream' | 'downstream' | 'both';
}

// =============================================================================
// API Route Handler
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse<TransformationResponse>> {
  try {
    console.log('🔍 [TRANSFORMATIONS API] POST request received');
    
    // Parse request body
    const body = await req.json() as TransformationRequestBody;
    const { table_name, table_id, source_layer, target_layer, direction = 'both' } = body;

    console.log('📥 [TRANSFORMATIONS API] Request data:', { 
      table_name, 
      table_id, 
      source_layer, 
      target_layer, 
      direction 
    });

    let transformations: Transformation[] = [];
    let summary: TransformationSummary;

    // Table-specific transformations (NEW FUNCTIONALITY)
    if (table_name || table_id) {
      const targetTable = table_name;
      const targetId = table_id;

      console.log('🎯 [TRANSFORMATIONS API] Fetching table-specific transformations');

      let whereClause = '';
      let params: (string | number)[] = [];

      if (targetTable) {
        if (direction === 'upstream') {
          whereClause = `tt.name = $1`;
          params = [targetTable];
        } else if (direction === 'downstream') {
          whereClause = `st.name = $1`;
          params = [targetTable];
        } else {
          whereClause = `(st.name = $1 OR tt.name = $1)`;
          params = [targetTable];
        }
      } else if (targetId) {
        if (direction === 'upstream') {
          whereClause = `t.target_table_id = $1`;
          params = [targetId];
        } else if (direction === 'downstream') {
          whereClause = `t.source_table_id = $1`;
          params = [targetId];
        } else {
          whereClause = `(t.source_table_id = $1 OR t.target_table_id = $1)`;
          params = [targetId];
        }
      }

      console.log('🔍 [TRANSFORMATIONS API] Executing table-specific query with params:', params);
      
      const result = await sql.query(`
        SELECT 
          t.id,
          t.name,
          t.description,
          t.script,
          t.transformation_type,
          t.status,
          t.created_at,
          t.updated_at,
          st.name as source_table,
          tt.name as target_table,
          sl.name as source_layer,
          tl.name as target_layer
        FROM transformations t
        JOIN tables st ON t.source_table_id = st.id
        JOIN tables tt ON t.target_table_id = tt.id
        JOIN layers sl ON st.layer_id = sl.id
        JOIN layers tl ON tt.layer_id = tl.id
        WHERE ${whereClause}
        ORDER BY sl.id, tl.id, t.created_at DESC
      `, params);

      transformations = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        source_table: row.source_table,
        target_table: row.target_table,
        source_layer: row.source_layer,
        target_layer: row.target_layer,
        transformation_type: row.transformation_type,
        confidence_score: 1.0, // Default confidence since not in schema
        created_at: row.created_at,
        script: row.script,
        status: row.status
      })) as Transformation[];

      // Create summary for table-specific transformations
      const layersInvolved = [...new Set([
        ...transformations.map(t => t.source_layer),
        ...transformations.map(t => t.target_layer)
      ])];

      const avgConfidence = 1.0; // Default since confidence_score not in actual schema

      summary = {
        total: transformations.length,
        table_name: targetTable || `Table ID ${targetId}`,
        layers_involved: layersInvolved,
        avg_confidence: avgConfidence
      };

      console.log('✅ [TRANSFORMATIONS API] Table-specific results:', {
        transformationCount: transformations.length,
        tableName: targetTable,
        layersInvolved
      });

    } 
    // Layer-to-layer transformations (EXISTING FUNCTIONALITY)
    else if (source_layer && target_layer) {
      console.log('🔍 [TRANSFORMATIONS API] Fetching layer-to-layer transformations');

      const result = await sql`
        SELECT 
          t.id,
          t.name,
          t.description,
          t.script,
          t.transformation_type,
          t.status,
          t.created_at,
          t.updated_at,
          st.name as source_table,
          tt.name as target_table,
          sl.name as source_layer,
          tl.name as target_layer
        FROM transformations t
        JOIN tables st ON t.source_table_id = st.id
        JOIN tables tt ON t.target_table_id = tt.id
        JOIN layers sl ON st.layer_id = sl.id
        JOIN layers tl ON tt.layer_id = tl.id
        WHERE sl.name = ${source_layer} AND tl.name = ${target_layer}
        ORDER BY t.created_at DESC
      `;

      transformations = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        source_table: row.source_table,
        target_table: row.target_table,
        source_layer: row.source_layer,
        target_layer: row.target_layer,
        transformation_type: row.transformation_type,
        confidence_score: 1.0, // Default confidence
        created_at: row.created_at,
        script: row.script,
        status: row.status
      })) as Transformation[];

      const avgConfidence = 1.0; // Default since confidence_score not in actual schema

      summary = {
        total: transformations.length,
        table_name: `${source_layer} → ${target_layer}`,
        layers_involved: [source_layer, target_layer],
        avg_confidence: avgConfidence
      };

      console.log('✅ [TRANSFORMATIONS API] Layer-to-layer results:', {
        transformationCount: transformations.length,
        sourceLayer: source_layer,
        targetLayer: target_layer
      });

    } else {
      console.error('❌ [TRANSFORMATIONS API] Missing required parameters');
      return NextResponse.json(
        { 
          transformations: [], 
          summary: { total: 0, table_name: '', layers_involved: [], avg_confidence: 0 },
          error: 'Either table_name/table_id or source_layer/target_layer must be provided' 
        },
        { status: 400 }
      );
    }

    // Success response
    const response: TransformationResponse = {
      transformations,
      summary
    };

    console.log('🎉 [TRANSFORMATIONS API] Success response:', {
      transformationCount: transformations.length,
      summaryTable: summary.table_name,
      avgConfidence: summary.avg_confidence
    });

    return NextResponse.json(response);

  } catch (err: unknown) {
    console.error('💥 [TRANSFORMATIONS API] Error:', err);
    
    const error = err instanceof Error ? err.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        transformations: [], 
        summary: { total: 0, table_name: '', layers_involved: [], avg_confidence: 0 },
        error: `Database error: ${error}` 
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET Method for URL Parameters (Alternative Access)
// =============================================================================

export async function GET(request: Request): Promise<NextResponse<TransformationResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const table_name = searchParams.get('table_name');
    const table_id = searchParams.get('table_id');
    const source_layer = searchParams.get('source_layer');
    const target_layer = searchParams.get('target_layer');
    const direction = searchParams.get('direction') || 'both';

    console.log('🔍 [TRANSFORMATIONS API] GET request received:', {
      table_name, table_id, source_layer, target_layer, direction
    });

    // Convert to POST-style processing
    const body = {
      table_name: table_name || undefined,
      table_id: table_id ? parseInt(table_id) : undefined,
      source_layer: source_layer || undefined,
      target_layer: target_layer || undefined,
      direction: direction as 'upstream' | 'downstream' | 'both'
    };

    // Create a mock request for POST processing
    const mockRequest = {
      json: async () => body
    } as NextRequest;

    return await POST(mockRequest);

  } catch (err: unknown) {
    console.error('💥 [TRANSFORMATIONS API GET] Error:', err);
    
    const error = err instanceof Error ? err.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        transformations: [], 
        summary: { total: 0, table_name: '', layers_involved: [], avg_confidence: 0 },
        error: `GET request error: ${error}` 
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// OPTIONS Method for CORS Support
// =============================================================================

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

