import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';


interface SearchTable {
  id: number;
  name: string;
  description: string;
  layer: string;
}

interface SearchColumn {
  id: number;
  name: string;
  data_type: string;
  table_name: string;
  layer: string;
}

interface SearchTransformation {
  id: number;
  name: string;
  description: string;
  transformation_type: string;
  source_table: string;
  target_table: string;
}

interface SearchResults {
  tables: SearchTable[];
  columns: SearchColumn[];
  transformations: SearchTransformation[];
  total: number;
}

interface SearchSuggestions {
  tables: string[];
  layers: string[];
}

interface SearchResponse {
  query: string;
  results: SearchResults;
  suggestions: SearchSuggestions;
  error?: string;
}

export async function GET(request: Request): Promise<NextResponse<SearchResponse>> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type') || 'all'; // 'tables', 'columns', 'transformations', 'all'

  if (!query || query.length < 2) {
    return NextResponse.json({
      query: query || '',
      results: { tables: [], columns: [], transformations: [], total: 0 },
      suggestions: { tables: [], layers: [] },
      error: 'Query must be at least 2 characters long'
    }, { status: 400 });
  }

  try {
    const results: SearchResults = {
      tables: [],
      columns: [],
      transformations: [],
      total: 0
    };

    // Search tables
    if (type === 'all' || type === 'tables') {
      const tableResult = await sql`
        SELECT 
          t.id,
          t.name,
          t.description,
          l.name as layer
        FROM tables t
        JOIN layers l ON t.layer_id = l.id
        WHERE t.name ILIKE ${`%${query}%`} OR t.description ILIKE ${`%${query}%`}
        ORDER BY t.name
        LIMIT 10
      `;
      results.tables = tableResult.rows as SearchTable[];
    }

    // Search columns
    if (type === 'all' || type === 'columns') {
      const columnResult = await sql`
        SELECT 
          c.id,
          c.name,
          c.data_type,
          t.name as table_name,
          l.name as layer
        FROM columns c
        JOIN tables t ON c.table_id = t.id
        JOIN layers l ON c.layer_id = l.id
        WHERE c.name ILIKE ${`%${query}%`}
        ORDER BY c.name
        LIMIT 10
      `;
      results.columns = columnResult.rows as SearchColumn[];
    }

    // Search transformations
    if (type === 'all' || type === 'transformations') {
      const transformationResult = await sql`
        SELECT 
          t.id,
          t.name,
          t.description,
          t.transformation_type,
          st.name as source_table,
          tt.name as target_table
        FROM transformations t
        JOIN tables st ON t.source_table_id = st.id
        JOIN tables tt ON t.target_table_id = tt.id
        WHERE t.name ILIKE ${`%${query}%`} OR t.description ILIKE ${`%${query}%`}
        ORDER BY t.confidence_score DESC
        LIMIT 10
      `;
      results.transformations = transformationResult.rows as SearchTransformation[];
    }

    results.total = results.tables.length + results.columns.length + results.transformations.length;

    const tableSuggestions = results.tables.slice(0, 3).map(t => t.name);
    const layerSuggestions = [...new Set(results.tables.map(t => t.layer))].slice(0, 3);

    return NextResponse.json({
      query,
      results,
      suggestions: {
        tables: tableSuggestions,
        layers: layerSuggestions
      }
    });

  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    console.error('[SEARCH ERROR]', err);
    return NextResponse.json({ 
      query,
      results: { tables: [], columns: [], transformations: [], total: 0 },
      suggestions: { tables: [], layers: [] },
      error 
    }, { status: 500 });
  }
}