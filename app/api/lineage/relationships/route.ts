import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

interface Relationship {
  id: number;
  relationship_type: string;
  description: string;
  confidence_score: number;
  source_table: string;
  source_table_id: number;
  source_layer: string;
  target_table: string;
  target_table_id: number;
  target_layer: string;
  direction: string;
}

interface RelationshipSummary {
  total: number;
  upstream: number;
  downstream: number;
  avg_confidence: number;
}

interface RelationshipResponse {
  relationships: Relationship[];
  summary: RelationshipSummary;
  error?: string;
}

export async function GET(request: Request): Promise<NextResponse<RelationshipResponse>> {
  const { searchParams } = new URL(request.url);
  const tableId = searchParams.get('table_id');
  const tableName = searchParams.get('table_name');
  const direction = searchParams.get('direction') || 'both'; // 'upstream', 'downstream', 'both'

  try {
    let baseQuery = '';
    let params: (string | number)[] = [];

    if (tableId) {
      const tableIdNum = parseInt(tableId);
      if (isNaN(tableIdNum)) {
        return NextResponse.json({ 
          relationships: [], 
          summary: { total: 0, upstream: 0, downstream: 0, avg_confidence: 0 },
          error: 'Invalid table ID' 
        });
      }

      baseQuery = `
        SELECT 
          tr.id,
          tr.relationship_type,
          tr.description,
          tr.confidence_score,
          st.name as source_table,
          st.id as source_table_id,
          sl.name as source_layer,
          tt.name as target_table,
          tt.id as target_table_id,
          tl.name as target_layer,
          CASE 
            WHEN tr.source_table_id = $1 THEN 'downstream'
            ELSE 'upstream'
          END as direction
        FROM table_relationships tr
        JOIN tables st ON tr.source_table_id = st.id
        JOIN tables tt ON tr.target_table_id = tt.id
        JOIN layers sl ON st.layer_id = sl.id
        JOIN layers tl ON tt.layer_id = tl.id
        WHERE 
      `;

      if (direction === 'upstream') {
        baseQuery += `tr.target_table_id = $1`;
      } else if (direction === 'downstream') {
        baseQuery += `tr.source_table_id = $1`;
      } else {
        baseQuery += `(tr.source_table_id = $1 OR tr.target_table_id = $1)`;
      }

      params = [tableIdNum];

    } else if (tableName) {
      baseQuery = `
        SELECT 
          tr.id,
          tr.relationship_type,
          tr.description,
          tr.confidence_score,
          st.name as source_table,
          st.id as source_table_id,
          sl.name as source_layer,
          tt.name as target_table,
          tt.id as target_table_id,
          tl.name as target_layer,
          CASE 
            WHEN st.name = $1 THEN 'downstream'
            ELSE 'upstream'
          END as direction
        FROM table_relationships tr
        JOIN tables st ON tr.source_table_id = st.id
        JOIN tables tt ON tr.target_table_id = tt.id
        JOIN layers sl ON st.layer_id = sl.id
        JOIN layers tl ON tt.layer_id = tl.id
        WHERE 
      `;

      if (direction === 'upstream') {
        baseQuery += `tt.name = $1`;
      } else if (direction === 'downstream') {
        baseQuery += `st.name = $1`;
      } else {
        baseQuery += `(st.name = $1 OR tt.name = $1)`;
      }

      params = [tableName];
    } else {
      // Return all relationships
      baseQuery = `
        SELECT 
          tr.id,
          tr.relationship_type,
          tr.description,
          tr.confidence_score,
          st.name as source_table,
          st.id as source_table_id,
          sl.name as source_layer,
          tt.name as target_table,
          tt.id as target_table_id,
          tl.name as target_layer,
          'both' as direction
        FROM table_relationships tr
        JOIN tables st ON tr.source_table_id = st.id
        JOIN tables tt ON tr.target_table_id = tt.id
        JOIN layers sl ON st.layer_id = sl.id
        JOIN layers tl ON tt.layer_id = tl.id
      `;
    }

    baseQuery += ` ORDER BY tr.confidence_score DESC`;

    const result = await sql.query(baseQuery, params);
    const relationships = result.rows as Relationship[];

    const upstreamCount = relationships.filter(r => r.direction === 'upstream').length;
    const downstreamCount = relationships.filter(r => r.direction === 'downstream').length;
    const avgConfidence = relationships.length > 0 
      ? relationships.reduce((sum, r) => sum + parseFloat(r.confidence_score.toString()), 0) / relationships.length 
      : 0;

    return NextResponse.json({ 
      relationships,
      summary: {
        total: relationships.length,
        upstream: upstreamCount,
        downstream: downstreamCount,
        avg_confidence: avgConfidence
      }
    });

  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    console.error('[FETCH RELATIONSHIPS ERROR]', err);
    return NextResponse.json({ 
      relationships: [], 
      summary: { total: 0, upstream: 0, downstream: 0, avg_confidence: 0 },
      error 
    });
  }
}