'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Loader2, 
  Workflow, 
  Eye,
  Code,
  Database,
  ArrowRight,
  Copy,
  Shuffle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { MermaidChartRenderer } from './mermaid-chart-renderer';

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

interface MermaidLineageData {
  nodes: LineageNode[];
  edges: LineageEdge[];
  mermaid_syntax: string;
  selected_table: string;
  selected_layer: string;
  total_depth: number;
  layers_involved: string[];
}

interface MermaidLineageViewerProps {
  tableName?: string;
  tableId?: number;
  layer?: string;
  direction?: 'upstream' | 'downstream' | 'both';
  onTableSelect?: (tableName: string) => void;
}

export function MermaidLineageViewer({ 
  tableName,
  tableId,
  layer,
  direction = 'both',
  onTableSelect
}: MermaidLineageViewerProps) {
  const [lineageData, setLineageData] = useState<MermaidLineageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('diagram');

  // =============================================================================
  // Main Fetch Function
  // =============================================================================

  const fetchLineageData = useCallback(async () => {
    if (!tableName || !layer) {
      console.log('🔍 [MERMAID VIEWER] Missing required parameters:', { tableName, layer });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [MERMAID VIEWER] Fetching lineage data:', {
        tableName, tableId, layer, direction
      });

      const requestBody = {
        table_name: tableName,
        layer: layer,
        direction: direction
      };

      const response = await fetch('/api/lineage/mermaid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ [MERMAID VIEWER] Response received:', {
        nodeCount: data.nodes?.length || 0,
        edgeCount: data.edges?.length || 0,
        totalDepth: data.total_depth,
        layersInvolved: data.layers_involved
      });

      if (data.error) {
        throw new Error(data.error);
      }

      setLineageData(data);
      
      const nodeCount = data.nodes?.length || 0;
      const layerCount = data.layers_involved?.length || 0;
      toast.success(`Lineage loaded: ${nodeCount} tables across ${layerCount} layers`);

    } catch (err: unknown) {
      console.error('💥 [MERMAID VIEWER] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Failed to load lineage: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, tableId, layer, direction]);

  // =============================================================================
  // Effects
  // =============================================================================

  useEffect(() => {
    if (tableName && layer) {
      fetchLineageData();
    }
  }, [fetchLineageData]);

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const handleNodeClick = useCallback((nodeId: string) => {
    console.log('🎯 [MERMAID VIEWER] Node clicked:', nodeId);
    
    // Extract table name from node ID (format: LAYER_TableName)
    const parts = nodeId.split('_');
    if (parts.length >= 2) {
      const extractedTableName = parts.slice(1).join('_');
      
      if (onTableSelect) {
        onTableSelect(extractedTableName);
        toast.success(`Selected table: ${extractedTableName}`);
      }
    }
  }, [onTableSelect]);

  // =============================================================================
  // Helper Functions
  // =============================================================================

  const getTransformationIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'COPY':
        return <Copy className="h-4 w-4" />;
      case 'TRANSFORM':
        return <Shuffle className="h-4 w-4" />;
      default:
        return <ArrowRight className="h-4 w-4" />;
    }
  };

  const getTransformationBadgeVariant = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'COPY':
        return 'secondary' as const;
      case 'TRANSFORM':
        return 'default' as const;
      default:
        return 'outline' as const;
    }
  };

  const getLayerBadgeColor = (layer: string) => {
    switch (layer.toLowerCase()) {
      case 'bronze':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const copyMermaidSyntax = () => {
    if (lineageData?.mermaid_syntax) {
      navigator.clipboard.writeText(lineageData.mermaid_syntax);
      toast.success('Mermaid syntax copied to clipboard!');
    }
  };

  // =============================================================================
  // Render Functions
  // =============================================================================

  if (!tableName || !layer) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Table</h3>
            <p className="text-gray-600">
              Select a table from the Tables tab to view its complete lineage flow across all layers.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Click the Lineage button next to any table to see its complete transformation journey.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Lineage Flow: {tableName}
          </CardTitle>
          <CardDescription>Loading lineage data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Lineage</h3>
              <p className="text-gray-600">
                Fetching transformation flow for {tableName} from {layer} layer...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Lineage Flow: {tableName}
          </CardTitle>
          <CardDescription>Error loading lineage data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <Workflow className="h-12 w-12 mx-auto mb-2" />
              <h3 className="text-lg font-medium mb-2">Failed to Load Lineage</h3>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={fetchLineageData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!lineageData || lineageData.nodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Lineage Flow: {tableName}
          </CardTitle>
          <CardDescription>No lineage data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Lineage Found</h3>
            <p className="text-gray-600">
              No transformation lineage found for {tableName} in {layer} layer.
            </p>
            <Button onClick={fetchLineageData} variant="outline" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Lineage Flow: {lineageData.selected_table}
              </CardTitle>
              <CardDescription>
                {lineageData.nodes.length} tables across {lineageData.layers_involved.length} layers with {lineageData.total_depth} transformation depth
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getLayerBadgeColor(lineageData.selected_layer)}>
                {lineageData.selected_layer}
              </Badge>
              <Button onClick={fetchLineageData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Layers involved:</span>
            {lineageData.layers_involved.map(layerName => (
              <Badge key={layerName} className={getLayerBadgeColor(layerName)}>
                {layerName}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="diagram" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Diagram
                </TabsTrigger>
                <TabsTrigger value="nodes" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Tables
                </TabsTrigger>
                <TabsTrigger value="syntax" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Mermaid Code
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Interactive Diagram Tab */}
            <TabsContent value="diagram" className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Interactive Lineage Diagram</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click on any table node to select it. Use controls to zoom and navigate.
                  </p>
                </div>
                
                {/* Interactive Mermaid Chart */}
                <MermaidChartRenderer
                  mermaidSyntax={lineageData.mermaid_syntax}
                  onNodeClick={handleNodeClick}
                  height={600}
                  className="border rounded-lg"
                />

                {/* Flow Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-orange-50 rounded-lg border">
                    <Database className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="font-medium text-orange-900">Source</div>
                    <div className="text-sm text-orange-700">{lineageData.nodes[0]?.name}</div>
                    <div className="text-xs text-orange-600">{lineageData.nodes[0]?.layer} layer</div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg border">
                    <ArrowRight className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="font-medium text-blue-900">Transformations</div>
                    <div className="text-sm text-blue-700">{lineageData.edges.length} steps</div>
                    <div className="text-xs text-blue-600">{lineageData.total_depth} depth levels</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg border">
                    <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="font-medium text-green-900">Target</div>
                    <div className="text-sm text-green-700">{lineageData.nodes[lineageData.nodes.length - 1]?.name}</div>
                    <div className="text-xs text-green-600">{lineageData.nodes[lineageData.nodes.length - 1]?.layer} layer</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tables Tab */}
            <TabsContent value="nodes" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Tables in Lineage</h3>
                  <Badge variant="outline">{lineageData.nodes.length} tables</Badge>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table Name</TableHead>
                      <TableHead>Layer</TableHead>
                      <TableHead>Columns</TableHead>
                      <TableHead>Depth</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineageData.nodes.map((node) => (
                      <TableRow key={`${node.layer}_${node.name}`}>
                        <TableCell className="font-medium">{node.name}</TableCell>
                        <TableCell>
                          <Badge className={getLayerBadgeColor(node.layer)}>
                            {node.layer}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {node.column_count || 0} columns
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            Depth {node.depth}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {node.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Transformations */}
                {lineageData.edges.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium mb-3">Transformations</h4>
                    <div className="space-y-2">
                      {lineageData.edges.map((edge, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Badge className={getLayerBadgeColor(edge.source_layer)}>
                            {edge.source_layer}
                          </Badge>
                          <span className="font-medium">{edge.source}</span>
                          <div className="flex items-center gap-2">
                            {getTransformationIcon(edge.transformation_type || 'TRANSFORM')}
                            <Badge variant={getTransformationBadgeVariant(edge.transformation_type || 'TRANSFORM')}>
                              {edge.transformation_type || 'TRANSFORM'}
                            </Badge>
                          </div>
                          <span className="font-medium">{edge.target}</span>
                          <Badge className={getLayerBadgeColor(edge.target_layer)}>
                            {edge.target_layer}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Mermaid Syntax Tab */}
            <TabsContent value="syntax" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Mermaid Diagram Code</h3>
                  <Button onClick={copyMermaidSyntax} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
                
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    <code>{lineageData.mermaid_syntax}</code>
                  </pre>
                </div>
                
                <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                  <strong>💡 Usage:</strong> Copy this code and paste it into any Mermaid-compatible editor 
                  (GitHub, GitLab, Notion, etc.) to render the interactive diagram.
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
