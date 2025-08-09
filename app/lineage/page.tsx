'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { EnhancedLineageTable } from '@/components/enhanced-lineage-table';
import { TransformationViewer } from '@/components/transformation-viewer';
import { RelationshipViewer } from '@/components/relationship-viewer';
import { MermaidLineageViewer } from '@/components/mermaid-lineage-viewer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  Database, 
  GitBranch, 
  Network, 
  Search,
  BarChart3,
  Settings,
  Workflow,
  Bot,
  Zap,
  RefreshCw
} from 'lucide-react';

interface Column {
  id: number;
  name: string;
  data_type: string;
  is_key: boolean;
  is_nullable?: boolean;
  table_name?: string;
  layer_name?: string;
}

interface TableRow {
  id: number;
  name: string;
  description: string;
  layer: string;
}

interface Transformation {
  id: number;
  name: string;
  description: string;
  source_table: string;
  target_table: string;
  source_layer: string;
  target_layer: string;
  transformation_type: string;
  confidence_score: number;
  created_at: string;
}

interface LayerStats {
  bronze: number;
  silver: number;
  gold: number;
  total: number;
}

interface ColumnsResponse {
  columns: Column[];
  table_name?: string;
  layer_name?: string;
  total_columns?: number;
  error?: string;
}

interface TablesResponse {
  tables: TableRow[];
  error?: string;
}

interface TaskData {
  targetObject: string;
  boundedArea: string;
  instructions: string;
  sourceContext: string;
}

const LAYER_MAP = {
  bronze: 1,
  silver: 2,
  gold: 3
} as const;

export default function LineagePage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableRow | null>(null);
  const [, setSelectedTransformation] = useState<Transformation | null>(null);
  const [loading, setLoading] = useState(false);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [layerFilter, setLayerFilter] = useState<string>('bronze');
  const [activeTab, setActiveTab] = useState<string>('tables');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchColumns = useCallback(async (tableName: string, layerName?: string) => {
    if (!tableName) return;

    const targetLayer = layerName || layerFilter;
    
    console.log('🔍 [FETCH COLUMNS] Request:', { 
      table: tableName, 
      layer: targetLayer,
      layerId: LAYER_MAP[targetLayer as keyof typeof LAYER_MAP]
    });

    try {
      setColumnsLoading(true);
      
      const res = await fetch('/api/lineage/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          table: tableName,
          layer: targetLayer  
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json() as ColumnsResponse;
      
      console.log('✅ [FETCH COLUMNS] Response:', {
        columnCount: json.columns?.length || 0,
        tableName: json.table_name,
        layerName: json.layer_name,
        totalColumns: json.total_columns
      });

      if (json.error) {
        throw new Error(json.error);
      }

      setColumns(json.columns || []);
      
      const layerInfo = json.layer_name ? ` in ${json.layer_name} layer` : '';
      toast.success(`Found ${json.columns?.length || 0} columns for ${tableName}${layerInfo}`);
      
    } catch (err) {
      console.error('💥 [FETCH COLUMNS ERROR]', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to fetch columns: ${errorMessage}`);
      setColumns([]);
    } finally {
      setColumnsLoading(false);
    }
  }, [layerFilter]);

  const fetchTables = useCallback(async () => {
    console.log('🔍 [FETCH TABLES] Request:', { layer: layerFilter });
    
    try {
      setLoading(true);
      setSelectedTable(null);
      setColumns([]);
      
      const res = await fetch(`/api/lineage/tables?layer=${layerFilter}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json() as TablesResponse;
      
      console.log('✅ [FETCH TABLES] Response:', {
        tableCount: json.tables?.length || 0,
        layer: layerFilter
      });

      if (json.error) {
        throw new Error(json.error);
      }
      
      setTables(json.tables || []);
      
      if (json.tables && json.tables.length > 0) {
        toast.success(`Found ${json.tables.length} tables in ${layerFilter} layer`);
      } else {
        toast.info(`No tables found in ${layerFilter} layer`);
      }
    } catch (err) {
      console.error('💥 [FETCH TABLES ERROR]', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to fetch tables: ${errorMessage}`);
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, [layerFilter]);

  const handleTableSelect = useCallback((table: TableRow) => {
    console.log('🎯 [TABLE SELECT]', { 
      table: table.name, 
      layer: table.layer,
      currentLayerFilter: layerFilter 
    });
    
    setSelectedTable(table);
    fetchColumns(table.name, table.layer);
    setActiveTab('tables');
  }, [fetchColumns, layerFilter]);

  const handleViewTransformations = useCallback((table: TableRow) => {
    console.log('🎯 [VIEW TRANSFORMATIONS]', { 
      table: table.name, 
      layer: table.layer,
      tableId: table.id 
    });
    
    setSelectedTable(table);
    setActiveTab('transformations');
    toast.info(`Viewing transformations for ${table.name}`);
  }, []);

  const handleViewRelationships = useCallback((table: TableRow) => {
    console.log('🎯 [VIEW RELATIONSHIPS]', { 
      table: table.name, 
      layer: table.layer,
      tableId: table.id 
    });
    
    setSelectedTable(table);
    setActiveTab('relationships');
    toast.info(`Viewing relationships for ${table.name}`);
  }, []);

  const handleViewLineage = useCallback((table: TableRow) => {
    console.log('🎯 [VIEW LINEAGE]', { 
      table: table.name, 
      layer: table.layer,
      tableId: table.id 
    });
    
    setSelectedTable(table);
    setActiveTab('lineage');
    toast.info(`Viewing lineage flow for ${table.name}`);
  }, []);

  const handleTransformationSelect = useCallback((transformation: Transformation) => {
    setSelectedTransformation(transformation);
    toast.success(`Selected transformation: ${transformation.name}`);
  }, []);

  const handleLayerFilterChange = useCallback((newLayer: string) => {
    console.log('🔄 [LAYER CHANGE]', { from: layerFilter, to: newLayer });
    
    setLayerFilter(newLayer);
    setSelectedTable(null);
    setColumns([]);
    
  }, [layerFilter]);

  // Enhanced AI Task Integration Functions
  const getTaskSuggestions = useCallback((): string[] => {
    const suggestions: string[] = [];
    
    if (selectedTable) {
      suggestions.push(`Analyze data quality issues in ${selectedTable.name}`);
      suggestions.push(`Generate documentation for ${selectedTable.name} transformations`);
      suggestions.push(`Identify optimization opportunities for ${selectedTable.name}`);
    }
    
    suggestions.push(`Review all ${layerFilter} layer performance metrics`);
    suggestions.push(`Audit ${layerFilter} layer data governance compliance`);
    suggestions.push('Analyze overall data lineage health and performance');
    
    return suggestions;
  }, [selectedTable, layerFilter]);

  const handleQuickTask = useCallback((suggestion: string) => {
    const taskData: TaskData = {
      targetObject: selectedTable?.name || `${layerFilter}_layer`,
      boundedArea: layerFilter,
      instructions: suggestion,
      sourceContext: `Data Lineage Explorer - ${selectedTable ? `Table: ${selectedTable.name}` : `Layer: ${layerFilter}`}`
    };
    
    // Store the task data in sessionStorage for the submit-task page to pick up
    sessionStorage.setItem('prefilledTask', JSON.stringify(taskData));
    
    // Show a toast to indicate the context is being carried forward
    toast.success(`Task context saved! Redirecting to submit form...`);
    
    // Navigate to submit-task page
    setTimeout(() => {
      window.location.href = '/submit-task';
    }, 500);
  }, [selectedTable, layerFilter]);

  // Enhanced submit task with context
  const handleSubmitTaskWithContext = useCallback(() => {
    const taskData: TaskData = {
      targetObject: selectedTable?.name || '',
      boundedArea: layerFilter,
      instructions: selectedTable 
        ? `Analyze ${selectedTable.name} table in the ${layerFilter} layer. Please provide insights on data quality, performance, and any optimization recommendations.`
        : `Analyze the ${layerFilter} layer for overall health, performance metrics, and data governance compliance.`,
      sourceContext: `Data Lineage Explorer - ${selectedTable ? `Table: ${selectedTable.name}` : `Layer: ${layerFilter}`}`
    };
    
    sessionStorage.setItem('prefilledTask', JSON.stringify(taskData));
    toast.success('Context saved! Redirecting to task submission...');
    
    setTimeout(() => {
      window.location.href = '/submit-task';
    }, 500);
  }, [selectedTable, layerFilter]);

  // Filter tables based on search
  const filteredTables = tables.filter(table => 
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    console.log('🔄 [LAYER EFFECT] Layer changed to:', layerFilter);
    fetchTables();
  }, [layerFilter, fetchTables]);

  const getLayerStats = useCallback((): LayerStats => {
    const layerCounts = tables.reduce((acc, table) => {
      acc[table.layer as keyof Omit<LayerStats, 'total'>] = (acc[table.layer as keyof Omit<LayerStats, 'total'>] || 0) + 1;
      return acc;
    }, { bronze: 0, silver: 0, gold: 0 } as Omit<LayerStats, 'total'>);

    return {
      bronze: layerCounts.bronze || 0,
      silver: layerCounts.silver || 0,
      gold: layerCounts.gold || 0,
      total: tables.length
    };
  }, [tables]);

  const stats = getLayerStats();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with AI Integration */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Lineage Explorer</h1>
          <p className="text-gray-600 mt-1">
            Explore your Microsoft Fabric Medallion Architecture and submit AI analysis tasks
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={layerFilter} onValueChange={handleLayerFilterChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Layer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bronze">Bronze</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchTables} disabled={loading} variant="outline">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button onClick={handleSubmitTaskWithContext}>
            <Bot className="w-4 h-4 mr-2" />
            Submit AI Task
          </Button>
        </div>
      </div>

      {/* AI Quick Tasks Card - Enhanced with Context */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Zap className="h-5 w-5" />
            Quick AI Tasks
            {selectedTable && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                Context: {selectedTable.name}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Context-aware AI analysis suggestions based on your current selection
            {selectedTable && ` (Table: ${selectedTable.name}, Layer: ${selectedTable.layer})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {getTaskSuggestions().slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleQuickTask(suggestion)}
                className="text-left p-3 bg-white hover:bg-yellow-50 rounded-lg border border-yellow-200 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <Bot className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0 group-hover:text-yellow-700" />
                  <span className="text-sm text-yellow-800 group-hover:text-yellow-900">{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
          {selectedTable && (
            <div className="mt-3 pt-3 border-t border-yellow-200">
              <p className="text-xs text-yellow-600">
                💡 These suggestions are tailored for <strong>{selectedTable.name}</strong> in the <strong>{selectedTable.layer}</strong> layer
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bronze Tables</CardTitle>
            <Database className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.bronze}</div>
            <p className="text-xs text-gray-600">Raw data layer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Silver Tables</CardTitle>
            <Database className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.silver}</div>
            <p className="text-xs text-gray-600">Cleansed data layer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gold Tables</CardTitle>
            <Database className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.gold}</div>
            <p className="text-xs text-gray-600">Business-ready layer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-gray-600">Across all layers</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tables by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {selectedTable && (
              <Badge variant="outline" className="flex items-center gap-1">
                Selected: {selectedTable.name}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Tables & Columns
          </TabsTrigger>
          <TabsTrigger value="transformations" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Transformations
          </TabsTrigger>
          <TabsTrigger value="relationships" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Relationships
          </TabsTrigger>
          <TabsTrigger value="lineage" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Lineage Flow
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
        </TabsList>

        {/* Tables & Columns Tab */}
        <TabsContent value="tables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {layerFilter.charAt(0).toUpperCase() + layerFilter.slice(1)} Layer Tables
              </CardTitle>
              <CardDescription>
                {filteredTables.length} tables found in the {layerFilter} layer
                {searchTerm && ` (filtered by "${searchTerm}")`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedLineageTable
                data={filteredTables}
                onRowSelect={handleTableSelect}
                onViewTransformations={handleViewTransformations}
                onViewRelationships={handleViewRelationships}
                onViewLineage={handleViewLineage}
              />
            </CardContent>
          </Card>

          {/* Column Details */}
          {selectedTable && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Columns: {selectedTable.name}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({selectedTable.layer} layer)
                  </span>
                </CardTitle>
                <CardDescription>
                  {columnsLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading columns...
                    </span>
                  ) : (
                    `${columns.length} columns in ${selectedTable.layer}.${selectedTable.name}`
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {columnsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Columns</h3>
                    <p className="text-gray-600">
                      Fetching columns for {selectedTable.name} from {selectedTable.layer} layer...
                    </p>
                  </div>
                ) : columns.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Columns Found</h3>
                    <p className="text-gray-600">
                      No columns found for table {selectedTable.name} in {selectedTable.layer} layer.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => fetchColumns(selectedTable.name, selectedTable.layer)}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Showing {columns.length} columns</span>
                      <span>Layer: {selectedTable.layer}</span>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Column Name</TableHead>
                          <TableHead>Data Type</TableHead>
                          <TableHead>Key</TableHead>
                          <TableHead>Nullable</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {columns.map((column) => (
                          <TableRow key={column.id}>
                            <TableCell className="font-medium">{column.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{column.data_type}</Badge>
                            </TableCell>
                            <TableCell>
                              {column.is_key ? (
                                <Badge className="bg-blue-100 text-blue-800">Key</Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {column.is_nullable ? (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Nullable</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700">Not Null</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transformations Tab */}
        <TabsContent value="transformations" className="space-y-6">
          {selectedTable ? (
            <TransformationViewer
              tableName={selectedTable.name}
              tableId={selectedTable.id}
              direction="both"
              onTransformationSelect={handleTransformationSelect}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Table</h3>
                  <p className="text-gray-600">
                    Select a table from the Tables tab to view its transformations.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships" className="space-y-6">
          {selectedTable ? (
            <RelationshipViewer
              tableName={selectedTable.name}
              tableId={selectedTable.id}
              direction="both"
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Table</h3>
                  <p className="text-gray-600">
                    Select a table from the Tables tab to view its relationships.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Lineage Flow Tab */}
        <TabsContent value="lineage" className="space-y-6">
          {selectedTable ? (
            <MermaidLineageViewer
              tableName={selectedTable.name}
              tableId={selectedTable.id}
              layer={selectedTable.layer}
              direction="both"
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Table</h3>
                  <p className="text-gray-600">
                    Select a table from the Tables tab to view its complete lineage flow.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Advanced Search
              </CardTitle>
              <CardDescription>
                Search across all tables, columns, and metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Search</h3>
                <p className="text-gray-600">
                  Advanced search functionality coming soon. Use the search bar above for basic table filtering.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
