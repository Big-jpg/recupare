import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

interface FlowNode {
  id: number;
  name: string;
  layer: string;
  type: string;
}

interface FlowEdge {
  id: number;
  source: number;
  target: number;
  type: string;
  confidence: number;
  depth: number;
}

interface FlowSummary {
  total_nodes: number;
  total_edges: number;
  max_depth: number;
  layers: string[];
}

interface FlowResponse {
  nodes: FlowNode[];
  edges: FlowEdge[];
  summary: FlowSummary;
  error?: string;
}

interface FlowRow {
  relationship_id: number;
  source_table_id: number;
  target_table_id: number;
  source_table: string;
  target_table: string;
  source_layer: string;
  target_layer: string;
  relationship_type: string;
  confidence_score: number;
  depth: number;
}

export async function GET(request: Request): Promise<NextResponse<FlowResponse>> {
  const { searchParams } = new URL(request.url);
  const startTable = searchParams.get('start_table');
  const endTable = searchParams.get('end_table');
  const maxDepth = parseInt(searchParams.get('max_depth') || '5');

  try {
    // Get complete flow using recursive CTE
    const flowQuery = `
      WITH RECURSIVE data_flow AS (
        -- Base case: start from the specified table or all bronze tables
        SELECT 
          tr.id as relationship_id,
          tr.source_table_id,
          tr.target_table_id,
          st.name as source_table,
          tt.name as target_table,
          sl.name as source_layer,
          tl.name as target_layer,
          tr.relationship_type,
          tr.confidence_score,
          1 as depth,
          ARRAY[tr.source_table_id] as path
        FROM table_relationships tr
        JOIN tables st ON tr.source_table_id = st.id
        JOIN tables tt ON tr.target_table_id = tt.id
        JOIN layers sl ON st.layer_id = sl.id
        JOIN layers tl ON tt.layer_id = tl.id
        WHERE ${startTable ? `st.name = '${startTable}'` : `sl.name = 'bronze'`}
        
        UNION ALL
        
        -- Recursive case: follow the flow
        SELECT 
          tr.id as relationship_id,
          tr.source_table_id,
          tr.target_table_id,
          st.name as source_table,
          tt.name as target_table,
          sl.name as source_layer,
          tl.name as target_layer,
          tr.relationship_type,
          tr.confidence_score,
          df.depth + 1,
          df.path || tr.source_table_id
        FROM table_relationships tr
        JOIN tables st ON tr.source_table_id = st.id
        JOIN tables tt ON tr.target_table_id = tt.id
        JOIN layers sl ON st.layer_id = sl.id
        JOIN layers tl ON tt.layer_id = tl.id
        JOIN data_flow df ON tr.source_table_id = df.target_table_id
        WHERE df.depth < ${maxDepth} 
          AND NOT (tr.source_table_id = ANY(df.path))
          ${endTable ? `AND tt.name != '${endTable}' OR df.depth = ${maxDepth - 1}` : ''}
      )
      SELECT DISTINCT * FROM data_flow
      ORDER BY depth, confidence_score DESC
    `;

    const result = await sql.query(flowQuery);
    const flowRows = result.rows as FlowRow[];

    // Transform data for DAG visualization
    const nodes = new Map<number, FlowNode>();
    const edges: FlowEdge[] = [];

    flowRows.forEach((row) => {
      // Add source node
      if (!nodes.has(row.source_table_id)) {
        nodes.set(row.source_table_id, {
          id: row.source_table_id,
          name: row.source_table,
          layer: row.source_layer,
          type: 'table'
        });
      }

      // Add target node
      if (!nodes.has(row.target_table_id)) {
        nodes.set(row.target_table_id, {
          id: row.target_table_id,
          name: row.target_table,
          layer: row.target_layer,
          type: 'table'
        });
      }

      // Add edge
      edges.push({
        id: row.relationship_id,
        source: row.source_table_id,
        target: row.target_table_id,
        type: row.relationship_type,
        confidence: parseFloat(row.confidence_score.toString()),
        depth: row.depth
      });
    });

    const nodeArray = Array.from(nodes.values());
    const maxDepthValue = edges.length > 0 ? Math.max(...edges.map(e => e.depth)) : 0;
    const uniqueLayers = [...new Set(nodeArray.map(n => n.layer))];

    return NextResponse.json({
      nodes: nodeArray,
      edges,
      summary: {
        total_nodes: nodes.size,
        total_edges: edges.length,
        max_depth: maxDepthValue,
        layers: uniqueLayers
      }
    });

  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    console.error('[FETCH DATA FLOW ERROR]', err);
    return NextResponse.json({ 
      nodes: [], 
      edges: [], 
      summary: { total_nodes: 0, total_edges: 0, max_depth: 0, layers: [] },
      error 
    });
  }
}