'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Bot, Lightbulb, Send, Loader2, Database } from 'lucide-react';
import Link from 'next/link';

interface TaskFormData {
  targetObject: string;
  boundedArea: string;
  instructions: string;
}

interface PrefilledTaskData {
  targetObject: string;
  boundedArea: string;
  instructions: string;
  sourceContext?: string;
}

interface TableOption {
  id: number;
  name: string;
  description: string;
  layer: string;
}

interface TablesResponse {
  tables: TableOption[];
  error?: string;
}

export default function SubmitTaskPage() {
  const [formData, setFormData] = useState<TaskFormData>({
    targetObject: '',
    boundedArea: '',
    instructions: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [prefilledContext, setPrefilledContext] = useState<string | null>(null);
  const [availableTables, setAvailableTables] = useState<TableOption[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // Load prefilled data from sessionStorage on component mount
  useEffect(() => {
    const prefilledData = sessionStorage.getItem('prefilledTask');
    if (prefilledData) {
      try {
        const parsed: PrefilledTaskData = JSON.parse(prefilledData);
        setFormData({
          targetObject: parsed.targetObject || '',
          boundedArea: parsed.boundedArea || '',
          instructions: parsed.instructions || ''
        });
        setCharacterCount(parsed.instructions?.length || 0);
        setPrefilledContext(parsed.sourceContext || 'Data Lineage Explorer');
        
        // Clear the prefilled data after loading
        sessionStorage.removeItem('prefilledTask');
        
        toast.success('Task details loaded from your selection!');
      } catch (error) {
        console.error('Error parsing prefilled task data:', error);
        toast.error('Error loading task details');
      }
    }
  }, []);

  // Fetch tables when bounded area changes
  useEffect(() => {
    if (formData.boundedArea && formData.boundedArea !== 'all_layers') {
      fetchTablesForLayer(formData.boundedArea);
    } else if (formData.boundedArea === 'all_layers') {
      fetchAllTables();
    } else {
      setAvailableTables([]);
    }
  }, [formData.boundedArea]);

  const fetchTablesForLayer = async (layer: string) => {
    if (!layer || layer === 'all_layers') return;
    
    setLoadingTables(true);
    try {
      const response = await fetch(`/api/lineage/tables?layer=${layer}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: TablesResponse = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      setAvailableTables(data.tables || []);
      
      // If current target object is not in the new list, clear it
      if (formData.targetObject && !data.tables?.some(table => table.name === formData.targetObject)) {
        setFormData(prev => ({ ...prev, targetObject: '' }));
      }
      
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error(`Failed to load tables for ${layer} layer`);
      setAvailableTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  const fetchAllTables = async () => {
    setLoadingTables(true);
    try {
      // Fetch tables from all layers
      const layers = ['bronze', 'silver', 'gold'];
      const allTablesPromises = layers.map(layer => 
        fetch(`/api/lineage/tables?layer=${layer}`).then(res => res.json())
      );
      
      const results = await Promise.all(allTablesPromises);
      const allTables: TableOption[] = [];
      
      results.forEach((result: TablesResponse) => {
        if (result.tables) {
          allTables.push(...result.tables);
        }
      });
      
      setAvailableTables(allTables);
      
    } catch (error) {
      console.error('Error fetching all tables:', error);
      toast.error('Failed to load tables from all layers');
      setAvailableTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'instructions') {
      setCharacterCount(value.length);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.targetObject || !formData.boundedArea || !formData.instructions) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.instructions.length < 10) {
      toast.error('Please provide more detailed instructions (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_object: formData.targetObject,
          bounded_area: formData.boundedArea,
          instructions: formData.instructions,
          source_context: prefilledContext || 'manual_submission'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit task');
      }
      
      toast.success('AI Agent task submitted successfully!');
      
      // Reset form
      setFormData({
        targetObject: '',
        boundedArea: '',
        instructions: ''
      });
      setCharacterCount(0);
      setPrefilledContext(null);
      setAvailableTables([]);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);

    } catch (error) {
      console.error('Error submitting task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to submit task: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBoundedAreaOptions = () => {
    return ['bronze', 'silver', 'gold', 'all_layers'];
  };

  const getTableDisplayName = (table: TableOption) => {
    return `${table.name} (${table.layer})`;
  };

  const exampleInstructions = [
    "Analyze sales performance for Q4 2024 compared to Q3 2024, focusing on revenue trends and top-performing products",
    "Generate a report on customer acquisition costs by marketing channel for the last 6 months",
    "Compare inventory turnover rates between different product categories and identify optimization opportunities",
    "Analyze employee retention rates by department and suggest improvement strategies",
    "Create a financial summary showing profit margins by business unit for the current fiscal year"
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Submit AI Agent Task</h1>
            <p className="text-gray-600 mt-1">
              Describe what the AI agent should analyze or process from your data.
            </p>
          </div>
        </div>
      </div>

      {/* Prefilled Context Alert */}
      {prefilledContext && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                Task details loaded from {prefilledContext}
              </span>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                Context-Aware
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Task Configuration
              </CardTitle>
              <CardDescription>
                Configure your AI agent task with specific targets and instructions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Bounded Area - Move this first so it affects Target Data Object */}
                <div>
                  <label htmlFor="boundedArea" className="block text-sm font-medium text-gray-700 mb-2">
                    Bounded Area *
                  </label>
                  <select
                    id="boundedArea"
                    value={formData.boundedArea}
                    onChange={(e) => handleInputChange('boundedArea', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a layer/area...</option>
                    {getBoundedAreaOptions().map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select the data layer first to see available tables
                  </p>
                </div>

                {/* Target Data Object - Now dynamically populated */}
                <div>
                  <label htmlFor="targetObject" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Data Object *
                  </label>
                  <div className="relative">
                    <select
                      id="targetObject"
                      value={formData.targetObject}
                      onChange={(e) => handleInputChange('targetObject', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={!formData.boundedArea || loadingTables}
                    >
                      <option value="">
                        {!formData.boundedArea 
                          ? "Select a bounded area first..." 
                          : loadingTables 
                          ? "Loading tables..." 
                          : "Select a data object..."
                        }
                      </option>
                      {availableTables.map((table) => (
                        <option key={`${table.layer}-${table.name}`} value={table.name}>
                          {getTableDisplayName(table)}
                        </option>
                      ))}
                      <option value="custom">Custom (specify in instructions)</option>
                    </select>
                    {loadingTables && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.boundedArea === 'all_layers' 
                      ? `Showing tables from all layers (${availableTables.length} available)`
                      : formData.boundedArea 
                      ? `Showing tables from ${formData.boundedArea} layer (${availableTables.length} available)`
                      : "Select a bounded area to see available tables"
                    }
                  </p>
                </div>

                {/* Task Instructions */}
                <div>
                  <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                    Task Instructions *
                  </label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    placeholder="Describe what you want the AI agent to analyze or process. Be specific about the time period, metrics, and desired output format."
                    className="min-h-[120px] resize-none"
                    maxLength={500}
                    required
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">
                      {characterCount}/500 characters
                    </span>
                    <span className="text-sm text-gray-500">
                      {characterCount < 10 ? 'Minimum 10 characters required' : 'Good length'}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || characterCount < 10}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting Task...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit AI Agent Task
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Available Tables Info */}
          {formData.boundedArea && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Database className="w-5 h-5" />
                  Available Tables
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTables ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600">Loading tables...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {formData.boundedArea === 'all_layers' 
                        ? `${availableTables.length} tables across all layers`
                        : `${availableTables.length} tables in ${formData.boundedArea} layer`
                      }
                    </p>
                    {availableTables.length > 0 && (
                      <div className="max-h-32 overflow-y-auto">
                        <div className="space-y-1">
                          {availableTables.slice(0, 5).map((table) => (
                            <div key={`${table.layer}-${table.name}`} className="text-xs text-gray-500">
                              • {table.name} ({table.layer})
                            </div>
                          ))}
                          {availableTables.length > 5 && (
                            <div className="text-xs text-gray-400">
                              ... and {availableTables.length - 5} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Example Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Lightbulb className="w-5 h-5" />
                Example Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {exampleInstructions.map((example, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleInputChange('instructions', example)}
                >
                  <p className="text-sm text-gray-700">{example}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tips for Better Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tips for Better Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">
                <ul className="space-y-2">
                  <li>• Be specific about time periods (e.g., &apos;Q4 2024&apos;, &apos;last 6 months&apos;)</li>
                  <li>• Mention desired output format (report, chart, summary)</li>
                  <li>• Include relevant metrics or KPIs you want analyzed</li>
                  <li>• Specify any comparisons you want made</li>
                  <li>• Mention if you need actionable recommendations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

