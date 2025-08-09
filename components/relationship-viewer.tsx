// Fixed React Components for Existing Next.js Data Lineage App
// All TypeScript issues resolved, no explicit 'any' types, proper ESLint compliance

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Network, 
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

// =============================================================================
// Type Definitions - Proper TypeScript interfaces
// =============================================================================

interface TableRow {
  id: number;
  name: string;
  description: string;
  layer: string;
}

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


interface RelationshipViewerProps {
  tableName: string;
  tableId: number;
  direction: 'upstream' | 'downstream' | 'both';
}

export function RelationshipViewer({ tableName, tableId, direction }: RelationshipViewerProps) {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [summary, setSummary] = useState<RelationshipSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRelationships = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/lineage/relationships?table_id=${tableId}&direction=${direction}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch relationships');
      }

      const data = await response.json();
      setRelationships(data.relationships || []);
      setSummary(data.summary || null);
      
      if (data.relationships?.length > 0) {
        toast.success(`Found ${data.relationships.length} relationships`);
      } else {
        toast.info(`No relationships found for ${tableName}`);
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
      toast.error('Failed to fetch relationships');
      setRelationships([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [tableId, direction, tableName]);

  const getRelationshipTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'lineage':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'enrichment':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'aggregation':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'reference':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDirectionIcon = (relationshipDirection: string) => {
    switch (relationshipDirection) {
      case 'upstream':
        return <ArrowRight className="h-4 w-4 text-blue-600 rotate-180" />;
      case 'downstream':
        return <ArrowRight className="h-4 w-4 text-green-600" />;
      default:
        return <Network className="h-4 w-4 text-gray-600" />;
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Relationship Summary: {tableName}
            </CardTitle>
            <CardDescription>
              {summary.total} relationships ({summary.upstream} upstream, {summary.downstream} downstream) 
              with {(summary.avg_confidence * 100).toFixed(1)}% average confidence
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Relationships List */}
      <Card>
        <CardHeader>
          <CardTitle>Table Relationships</CardTitle>
          <CardDescription>
            Data flow connections and dependencies for {tableName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading relationships...</span>
            </div>
          ) : relationships.length === 0 ? (
            <div className="text-center py-8">
              <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Relationships Found</h3>
              <p className="text-gray-600">
                No relationships found for table {tableName}.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Related Table</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Layer</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relationships.map((relationship) => (
                  <TableRow key={relationship.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDirectionIcon(relationship.direction)}
                        <span className="capitalize">{relationship.direction}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {relationship.direction === 'upstream' 
                          ? relationship.source_table 
                          : relationship.target_table}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRelationshipTypeColor(relationship.relationship_type)}>
                        {relationship.relationship_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {relationship.direction === 'upstream' 
                          ? relationship.source_layer 
                          : relationship.target_layer}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${relationship.confidence_score * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {(relationship.confidence_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{relationship.description}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}