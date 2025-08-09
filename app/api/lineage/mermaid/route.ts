// app/api/lineage/mermaid/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// =============================================================================
// Type Definitions
// =============================================================================

interface LineageNode {
  id: number;
  name: string;
  layer: string;
  layer_id: number;
  depth: number;
  column_count?: number;
  description?: string;
}

interface LineageEdge {
  source: string;
  target: string;
  source_layer: string;
  target_layer: string;
  transformation_type?: string;
}

interface MermaidLineageResponse {
  nodes: LineageNode[];
  edges: LineageEdge[];
  mermaid_syntax: string;
  selected_table: string;
  selected_layer: string;
  total_depth: number;
  layers_involved: string[];
  error?: string;
}

interface MermaidRequestBody {
  table_name: string;
  layer: string;
  direction?: 'upstream' | 'downstream' | 'both';
}

// =============================================================================
// API Route Handler
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse<MermaidLineageResponse>> {
  try {
    console.log('🎯 [MERMAID API] POST request received');
    
    // Parse request body
    const body = await req.json() as MermaidRequestBody;
    const { table_name, layer, direction = 'both' } = body;

    console.log('📥 [MERMAID API] Request data:', { 
      table_name, 
      layer, 
      direction 
    });

    if (!table_name || !layer) {
      console.error('❌ [MERMAID API] Missing required parameters');
      return NextResponse.json(
        { 
          nodes: [],
          edges: [],
          mermaid_syntax: '',
          selected_table: table_name || '',
          selected_layer: layer || '',
          total_depth: 0,
          layers_involved: [],
          error: 'table_name and layer are required' 
        },
        { status: 400 }
      );
    }

    // Execute recursive CTE query to get complete lineage chain
    console.log('🔍 [MERMAID API] Executing recursive lineage query...');
    
    const lineageResult = await sql`
      WITH RECURSIVE lineage_chain AS (
        -- Start with the selected table
        SELECT t.id, t.name, l.name as layer, l.id as layer_id, 0 as depth, t.description
        FROM tables t 
        JOIN layers l ON t.layer_id = l.id
        WHERE t.name = ${table_name} AND l.name = ${layer}
        
        UNION ALL
        
        -- Follow transformations downstream
        SELECT tt.id, tt.name, tl.name as layer, tl.id as layer_id, lc.depth + 1, tt.description
        FROM lineage_chain lc
        JOIN transformations tr ON lc.id = tr.source_table_id
        JOIN tables tt ON tr.target_table_id = tt.id
        JOIN layers tl ON tt.layer_id = tl.id
        WHERE lc.depth < 3  -- Prevent infinite loops
      )
      SELECT * FROM lineage_chain ORDER BY layer_id, name
    `;

    const nodes: LineageNode[] = [];
    
    // Process each node and get column counts
    for (const row of lineageResult.rows) {
      // Get column count for this table
      const columnResult = await sql`
        SELECT COUNT(*) as column_count
        FROM columns c
        WHERE c.table_id = ${row.id}
      `;
      
      const columnCount = columnResult.rows[0]?.column_count || 0;
      
      nodes.push({
        id: row.id,
        name: row.name,
        layer: row.layer,
        layer_id: row.layer_id,
        depth: row.depth,
        column_count: parseInt(columnCount.toString()),
        description: row.description || `${row.name} table in ${row.layer} layer`
      });
    }

    console.log('✅ [MERMAID API] Lineage nodes retrieved:', {
      nodeCount: nodes.length,
      nodes: nodes.map(n => `${n.name}(${n.layer}, ${n.column_count} cols, depth=${n.depth})`)
    });

    // Get transformation edges between the nodes
    console.log('🔍 [MERMAID API] Fetching transformation edges...');
    
    const edges: LineageEdge[] = [];
    
    // Create edges between consecutive nodes in the lineage
    for (let i = 0; i < nodes.length - 1; i++) {
      const sourceNode = nodes[i];
      const targetNode = nodes[i + 1];
      
      // Query for transformation between these specific nodes
      const transformationResult = await sql`
        SELECT 
          t.transformation_type,
          st.name as source_table,
          tt.name as target_table,
          sl.name as source_layer,
          tl.name as target_layer
        FROM transformations t
        JOIN tables st ON t.source_table_id = st.id
        JOIN tables tt ON t.target_table_id = tt.id
        JOIN layers sl ON st.layer_id = sl.id
        JOIN layers tl ON tt.layer_id = tl.id
        WHERE st.id = ${sourceNode.id} AND tt.id = ${targetNode.id}
      `;

      if (transformationResult.rows.length > 0) {
        const transformation = transformationResult.rows[0];
        edges.push({
          source: sourceNode.name,
          target: targetNode.name,
          source_layer: sourceNode.layer,
          target_layer: targetNode.layer,
          transformation_type: transformation.transformation_type
        });
      }
    }

    console.log('✅ [MERMAID API] Transformation edges retrieved:', {
      edgeCount: edges.length,
      edges: edges.map(e => `${e.source}(${e.source_layer}) --${e.transformation_type}--> ${e.target}(${e.target_layer})`)
    });

    // Calculate metadata
    const totalDepth = nodes.length > 0 ? Math.max(...nodes.map(n => n.depth)) : 0;
    const layersInvolved = [...new Set(nodes.map(n => n.layer))];

    // Generate Enhanced Mermaid Syntax with Subgraphs
    let mermaidSyntax = 'graph LR\n\n';
    
    // Group nodes by layer for subgraphs
    const nodesByLayer = nodes.reduce((acc, node) => {
      if (!acc[node.layer]) acc[node.layer] = [];
      acc[node.layer].push(node);
      return acc;
    }, {} as Record<string, LineageNode[]>);

    // Create subgraphs for each layer
    Object.entries(nodesByLayer).forEach(([layerName, layerNodes]) => {
      const layerTitle = `${layerName.charAt(0).toUpperCase() + layerName.slice(1)} Layer`;
      const layerDescription = layerName === 'bronze' ? 'Raw Data' : 
                              layerName === 'silver' ? 'Cleansed Data' : 
                              'Business Ready';
      
      mermaidSyntax += `    subgraph "${layerTitle} - ${layerDescription}"\n`;
      
      layerNodes.forEach(node => {
        const nodeId = `${node.layer.toUpperCase()}_${node.name}`;
        const nodeLabel = `${node.name}<br/>${node.column_count} columns<br/>${node.description}`;
        mermaidSyntax += `        ${nodeId}["${nodeLabel}"]\n`;
      });
      
      mermaidSyntax += `    end\n\n`;
    });

    // Add edges between subgraphs
    edges.forEach(edge => {
      const sourceId = `${edge.source_layer.toUpperCase()}_${edge.source}`;
      const targetId = `${edge.target_layer.toUpperCase()}_${edge.target}`;
      mermaidSyntax += `    ${sourceId} -->|${edge.transformation_type}| ${targetId}\n`;
    });

    // Add enhanced styling
    mermaidSyntax += `\n    %% Layer Styling\n`;
    mermaidSyntax += `    classDef bronze fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000\n`;
    mermaidSyntax += `    classDef silver fill:#f3e5f5,stroke:#4a148c,stroke-width:2px,color:#000\n`;
    mermaidSyntax += `    classDef gold fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px,color:#000\n\n`;

    // Apply styles to nodes
    Object.entries(nodesByLayer).forEach(([layerName, layerNodes]) => {
      layerNodes.forEach(node => {
        const nodeId = `${node.layer.toUpperCase()}_${node.name}`;
        mermaidSyntax += `    class ${nodeId} ${layerName}\n`;
      });
    });

    console.log('🎨 [MERMAID API] Generated Enhanced Mermaid syntax:');
    console.log(mermaidSyntax);

    // Success response
    const response: MermaidLineageResponse = {
      nodes,
      edges,
      mermaid_syntax: mermaidSyntax,
      selected_table: table_name,
      selected_layer: layer,
      total_depth: totalDepth,
      layers_involved: layersInvolved
    };

    console.log('🎉 [MERMAID API] Success response:', {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      selectedTable: table_name,
      selectedLayer: layer,
      totalDepth: totalDepth,
      layersInvolved: layersInvolved
    });

    return NextResponse.json(response);

  } catch (err: unknown) {
    console.error('💥 [MERMAID API] Error:', err);
    
    const error = err instanceof Error ? err.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        nodes: [],
        edges: [],
        mermaid_syntax: '',
        selected_table: '',
        selected_layer: '',
        total_depth: 0,
        layers_involved: [],
        error: `Database error: ${error}` 
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET Method for URL Parameters (Alternative Access)
// =============================================================================

export async function GET(request: Request): Promise<NextResponse<MermaidLineageResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const table_name = searchParams.get('table_name');
    const layer = searchParams.get('layer');
    const direction = searchParams.get('direction') || 'both';

    console.log('🔍 [MERMAID API] GET request received:', {
      table_name, layer, direction
    });

    if (!table_name || !layer) {
      return NextResponse.json(
        { 
          nodes: [],
          edges: [],
          mermaid_syntax: '',
          selected_table: table_name || '',
          selected_layer: layer || '',
          total_depth: 0,
          layers_involved: [],
          error: 'table_name and layer parameters are required' 
        },
        { status: 400 }
      );
    }

    // Convert to POST-style processing
    const body = {
      table_name,
      layer,
      direction: direction as 'upstream' | 'downstream' | 'both'
    };

    // Create a mock request for POST processing
    const mockRequest = {
      json: async () => body
    } as NextRequest;

    return await POST(mockRequest);

  } catch (err: unknown) {
    console.error('💥 [MERMAID API GET] Error:', err);
    
    const error = err instanceof Error ? err.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        nodes: [],
        edges: [],
        mermaid_syntax: '',
        selected_table: '',
        selected_layer: '',
        total_depth: 0,
        layers_involved: [],
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

