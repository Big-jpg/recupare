// Enhanced Lineage Table with Lineage Flow Support
// components/enhanced-lineage-table.tsx

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  GitBranch, 
  Network, 
  Database,
  Workflow // NEW ICON
} from 'lucide-react';

// =============================================================================
// Type Definitions - Updated with onViewLineage prop
// =============================================================================

interface TableRow {
  id: number;
  name: string;
  description: string;
  layer: string;
}

interface EnhancedLineageTableProps {
  data: TableRow[];
  onRowSelect: (table: TableRow) => void;
  onViewTransformations: (table: TableRow) => void;
  onViewRelationships: (table: TableRow) => void;
  onViewLineage: (table: TableRow) => void; // NEW PROP
}

export function EnhancedLineageTable({ 
  data, 
  onRowSelect, 
  onViewTransformations, 
  onViewRelationships,
  onViewLineage // NEW PROP
}: EnhancedLineageTableProps) {
  const [selectedRow, setSelectedRow] = useState<TableRow | null>(null);

  const handleRowClick = (table: TableRow) => {
    setSelectedRow(table);
    onRowSelect(table);
  };

  const getLayerBadgeColor = (layer: string): string => {
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

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Tables Found</h3>
        <p className="text-gray-600">No tables found for the selected layer.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Table Name</TableHead>
          <TableHead>Layer</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((table) => (
          <TableRow 
            key={table.id}
            className={`cursor-pointer hover:bg-gray-50 ${
              selectedRow?.id === table.id ? 'bg-blue-50 border-blue-200' : ''
            }`}
            onClick={() => handleRowClick(table)}
          >
            <TableCell className="font-medium">{table.name}</TableCell>
            <TableCell>
              <Badge className={getLayerBadgeColor(table.layer)}>
                {table.layer}
              </Badge>
            </TableCell>
            <TableCell className="text-gray-600">{table.description}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewTransformations(table);
                  }}
                  className="h-8"
                >
                  <GitBranch className="h-3 w-3 mr-1" />
                  Transformations
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewRelationships(table);
                  }}
                  className="h-8"
                >
                  <Network className="h-3 w-3 mr-1" />
                  Relationships
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewLineage(table);
                  }}
                  className="h-8"
                >
                  <Workflow className="h-3 w-3 mr-1" />
                  Lineage
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
