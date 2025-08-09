// Corrected Transformation Viewer Component - Fixed Field Names
// components/transformation-viewer.tsx

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
  GitBranch, 
  Eye,
  Code,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Database,
  Layers,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

// =============================================================================
// Type Definitions - Corrected to match actual schema
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
  confidence_score: number;
  created_at: string;
  script?: string; // Changed from sql_logic to script
  status?: string; // Added status field
}

interface TransformationSummary {
  total: number;
  table_name: string;
  layers_involved: string[];
  avg_confidence: number;
}

interface TransformationViewerProps {
  // NEW: Table-specific props
  tableName?: string;
  tableId?: number;
  direction?: 'upstream' | 'downstream' | 'both';
  
  // EXISTING: Layer-to-layer props (for backward compatibility)
  sourceLayer?: string;
  targetLayer?: string;
  
  onTransformationSelect?: (transformation: Transformation) => void;
}

export function TransformationViewer({ 
  tableName,
  tableId,
  direction = 'both',
  sourceLayer, 
  targetLayer, 
  onTransformationSelect 
}: TransformationViewerProps) {
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [summary, setSummary] = useState<TransformationSummary | null>(null);
  const [selectedTransformation, setSelectedTransformation] = useState<Transformation | null>(null);
  const [loading, setLoading] = useState(false);

  // =============================================================================
  // Main Fetch Function - Supports Both Table-Specific and Layer-to-Layer
  // =============================================================================

  const fetchTransformations = useCallback(async () => {
    try {
      setLoading(true);
      
      let requestBody: Record<string, unknown>;
      let requestDescription: string;

      // NEW: Table-specific transformations
      if (tableName || tableId) {
        requestBody = {
          table_name: tableName,
          table_id: tableId,
          direction: direction
        };
        requestDescription = `table-specific transformations for ${tableName || `ID ${tableId}`}`;
        
        console.log('🔍 [TRANSFORMATION VIEWER] Fetching table-specific transformations:', {
          tableName, tableId, direction
        });
      } 
      // EXISTING: Layer-to-layer transformations
      else if (sourceLayer && targetLayer) {
        requestBody = {
          source_layer: sourceLayer,
          target_layer: targetLayer
        };
        requestDescription = `layer transformations ${sourceLayer} → ${targetLayer}`;
        
        console.log('🔍 [TRANSFORMATION VIEWER] Fetching layer-to-layer transformations:', {
          sourceLayer, targetLayer
        });
      } else {
        console.error('❌ [TRANSFORMATION VIEWER] Missing required parameters');
        toast.error('Missing required parameters for transformation fetch');
        return;
      }

      const response = await fetch('/api/lineage/transformations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ [TRANSFORMATION VIEWER] Response received:', {
        transformationCount: data.transformations?.length || 0,
        summaryTable: data.summary?.table_name,
        avgConfidence: data.summary?.avg_confidence
      });

      if (data.error) {
        throw new Error(data.error);
      }

      setTransformations(data.transformations || []);
      setSummary(data.summary || null);
      
      if (data.transformations?.length > 0) {
        toast.success(`Found ${data.transformations.length} ${requestDescription}`);
      } else {
        toast.info(`No ${requestDescription} found`);
      }
    } catch (error) {
      console.error('💥 [TRANSFORMATION VIEWER] Error fetching transformations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to fetch transformations: ${errorMessage}`);
      setTransformations([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [tableName, tableId, direction, sourceLayer, targetLayer]);

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const handleTransformationClick = (transformation: Transformation) => {
    console.log('🎯 [TRANSFORMATION VIEWER] Transformation selected:', transformation.name);
    
    if (onTransformationSelect) {
      onTransformationSelect(transformation);
    }
    
    setSelectedTransformation(transformation);
  };

  // =============================================================================
  // Utility Functions
  // =============================================================================

  const getTransformationTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'copy':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'transform':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cleansing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'deduplication':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'standardization':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'enrichment':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'aggregation':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return <AlertCircle className="h-4 w-4 text-gray-400" />;
    
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getLayerBadgeColor = (layer: string): string => {
    switch (layer.toLowerCase()) {
      case 'bronze':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'raw':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // =============================================================================
  // Effects
  // =============================================================================

  useEffect(() => {
    fetchTransformations();
  }, [fetchTransformations]);

  // =============================================================================
  // Render Functions
  // =============================================================================

  const renderSummaryCard = () => {
    if (!summary) return null;

    const isTableSpecific = tableName || tableId;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isTableSpecific ? (
              <>
                <Database className="h-5 w-5" />
                Transformation Summary: {summary.table_name}
              </>
            ) : (
              <>
                <GitBranch className="h-5 w-5" />
                Transformation Summary: {summary.table_name}
              </>
            )}
          </CardTitle>
          <CardDescription>
            {summary.total} transformations across {summary.layers_involved.join(' → ')} layers
            {summary.avg_confidence > 0 && (
              <> with {(summary.avg_confidence * 100).toFixed(1)}% average confidence</>
            )}
          </CardDescription>
        </CardHeader>
        {isTableSpecific && summary.layers_involved.length > 0 && (
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Layers involved:</span>
              {summary.layers_involved.map((layer, index) => (
                <React.Fragment key={layer}>
                  <Badge className={getLayerBadgeColor(layer)}>
                    {layer}
                  </Badge>
                  {index < summary.layers_involved.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-gray-400 self-center" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  const renderTransformationsList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2">Loading transformations...</span>
        </div>
      );
    }

    if (transformations.length === 0) {
      const contextMessage = tableName 
        ? `No transformations found for table ${tableName}`
        : sourceLayer && targetLayer
        ? `No transformations found between ${sourceLayer} and ${targetLayer} layers`
        : 'No transformations found';

      return (
        <div className="text-center py-8">
          <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Transformations Found</h3>
          <p className="text-gray-600">{contextMessage}</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transformation</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Source → Target</TableHead>
            <TableHead>Layers</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transformations.map((transformation) => (
            <TableRow 
              key={transformation.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleTransformationClick(transformation)}
            >
              <TableCell>
                <div>
                  <div className="font-medium">{transformation.name}</div>
                  <div className="text-sm text-gray-600">{transformation.description}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getTransformationTypeColor(transformation.transformation_type)}>
                  {transformation.transformation_type}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{transformation.source_table}</span>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                  <span className="text-sm">{transformation.target_table}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Badge className={getLayerBadgeColor(transformation.source_layer)} variant="outline">
                    {transformation.source_layer}
                  </Badge>
                  <ArrowRight className="h-2 w-2 text-gray-400" />
                  <Badge className={getLayerBadgeColor(transformation.target_layer)} variant="outline">
                    {transformation.target_layer}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(transformation.status)}
                  <span className="text-sm capitalize">
                    {transformation.status || 'Unknown'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // =============================================================================
  // Main Render
  // =============================================================================

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {renderSummaryCard()}

      {/* Transformations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {tableName ? `Transformations for ${tableName}` : 'Available Transformations'}
          </CardTitle>
          <CardDescription>
            {tableName 
              ? `All transformations involving ${tableName} across different layers`
              : 'Click on a transformation to view detailed information'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderTransformationsList()}
        </CardContent>
      </Card>

      {/* Transformation Details */}
      {selectedTransformation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Transformation Details: {selectedTransformation.name}
            </CardTitle>
            <CardDescription>
              {selectedTransformation.source_layer}.{selectedTransformation.source_table} → {selectedTransformation.target_layer}.{selectedTransformation.target_table}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="script">SQL Script</TabsTrigger>
                <TabsTrigger value="status">Status</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Transformation Type</h4>
                    <Badge className={getTransformationTypeColor(selectedTransformation.transformation_type)}>
                      {selectedTransformation.transformation_type}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedTransformation.status)}
                      <span className="text-sm capitalize">
                        {selectedTransformation.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Created</h4>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(selectedTransformation.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Confidence</h4>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {(selectedTransformation.confidence_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedTransformation.description}</p>
                </div>
              </TabsContent>

              <TabsContent value="script" className="space-y-4">
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
                    <code>{selectedTransformation.script || 'No SQL script available'}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="status" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(selectedTransformation.status)}
                      <div>
                        <h4 className="text-sm font-medium">Current Status</h4>
                        <p className="text-sm text-gray-600 capitalize">
                          {selectedTransformation.status || 'Status unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-medium">Last Updated</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedTransformation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p><strong>Note:</strong> Detailed execution logs and history tracking will be available in future updates.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

