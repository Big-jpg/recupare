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
  targetObject: string;   // e.g., 'invoice_pdf', 'contract_docx'
  boundedArea: string;    // e.g., 'retrieval', 'parsing'
  instructions: string;
}

interface PrefilledTaskData {
  targetObject: string;
  boundedArea: string;
  instructions: string;
  sourceContext?: string;
}

interface ObjectOption {
  id?: number | string;
  name: string;           // canonical identifier (e.g., 'invoice_pdf')
  description?: string;
  kind?: string;          // optional: 'pdf', 'image', 'email', etc.
}

interface ObjectsResponse {
  objects: ObjectOption[];
  error?: string;
}

const FALLBACK_OBJECTS: Record<string, ObjectOption[]> = {
  retrieval: [
    { name: 'invoice_pdf', description: 'Invoices (PDF)' },
    { name: 'contract_docx', description: 'Contracts (DOCX)' },
    { name: 'email_msg', description: 'Emails (.msg/.eml)' },
    { name: 'policy_pdf', description: 'Policies & Manuals (PDF)' },
  ],
  parsing: [
    { name: 'receipt_image', description: 'Receipts (images)' },
    { name: 'form_scan', description: 'Scanned forms (PDF/Image)' },
    { name: 'shipment_csv', description: 'Shipment manifests (CSV)' },
  ],
  translation: [
    { name: 'brochure_pdf', description: 'Brochures (PDF)' },
    { name: 'contract_docx', description: 'Contracts (DOCX)' },
    { name: 'support_email', description: 'Support emails' },
  ],
  qa: [
    { name: 'extracted_json', description: 'Extracted JSON bundles' },
    { name: 'table_csv', description: 'Tables (CSV)' },
  ],
  export: [
    { name: 'normalized_json', description: 'Normalized JSON' },
    { name: 'xlsx_report', description: 'Excel report (XLSX)' },
  ],
  indexing: [
    { name: 'raw_pdf', description: 'Raw PDFs' },
    { name: 'ocr_text', description: 'OCR text chunks' },
  ],
};

export default function SubmitTaskPage() {
  const [formData, setFormData] = useState<TaskFormData>({
    targetObject: '',
    boundedArea: '',
    instructions: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [prefilledContext, setPrefilledContext] = useState<string | null>(null);
  const [availableObjects, setAvailableObjects] = useState<ObjectOption[]>([]);
  const [loadingObjects, setLoadingObjects] = useState(false);

  // Load prefilled data from sessionStorage on component mount
  useEffect(() => {
    const prefilledData = sessionStorage.getItem('prefilledTask');
    if (prefilledData) {
      try {
        const parsed: PrefilledTaskData = JSON.parse(prefilledData);
        setFormData({
          targetObject: parsed.targetObject || '',
          boundedArea: parsed.boundedArea || '',
          instructions: parsed.instructions || '',
        });
        setCharacterCount(parsed.instructions?.length || 0);
        setPrefilledContext(parsed.sourceContext || 'Document Workspace');

        // Clear after loading
        sessionStorage.removeItem('prefilledTask');

        toast.success('Task details loaded from your selection!');
      } catch (error) {
        console.error('Error parsing prefilled task data:', error);
        toast.error('Error loading task details');
      }
    }
  }, []);

  // Fetch objects when bounded area changes
  useEffect(() => {
    if (formData.boundedArea) {
      fetchObjectsForArea(formData.boundedArea);
    } else {
      setAvailableObjects([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.boundedArea]);

  const fetchObjectsForArea = async (area: string) => {
    setLoadingObjects(true);
    try {
      const res = await fetch(`/api/docs/objects?area=${encodeURIComponent(area)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data: ObjectsResponse = await res.json();
      if (data.error) throw new Error(data.error);
      const objs = data.objects || [];
      setAvailableObjects(objs);

      // Clear target if it no longer exists in new list
      if (formData.targetObject && !objs.some(o => o.name === formData.targetObject)) {
        setFormData(prev => ({ ...prev, targetObject: '' }));
      }
    } catch {
      // Graceful fallback to static defaults
      setAvailableObjects(FALLBACK_OBJECTS[area] || []);
    } finally {
      setLoadingObjects(false);
    }
  };

  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'instructions') setCharacterCount(value.length);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_object: formData.targetObject,
          bounded_area: formData.boundedArea, // retrieval | parsing | translation | qa | export | indexing
          instructions: formData.instructions,
          source_context: prefilledContext || 'manual_submission',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit task');
      }

      toast.success('AI Document task submitted successfully!');
      setFormData({ targetObject: '', boundedArea: '', instructions: '' });
      setCharacterCount(0);
      setPrefilledContext(null);
      setAvailableObjects([]);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1200);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to submit task: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const boundedAreaOptions = ['retrieval', 'parsing', 'translation', 'qa', 'export', 'indexing'];

  const exampleInstructions = [
    'Retrieve all invoices from March–May 2025 mentioning “PO-3*”, then summarize totals per supplier.',
    'Parse the attached receipts (images) and extract date, total, GST, and merchant into a JSONL file.',
    'Translate the uploaded contract (DOCX) from Italian to English, preserving headings and tables.',
    'Run QA on extracted JSON vs. PDF totals; flag any variance > 0.5% with a brief note.',
    'Export parsed shipment manifests into a single XLSX with normalized column names.',
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
            <h1 className="text-3xl font-bold text-gray-900">Submit Document Task</h1>
            <p className="text-gray-600 mt-1">
              Describe what the agent should do — retrieve, parse (OCR), translate, QA, or export.
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
                Configure your agentic document task with a bounded area and target object
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Bounded Area */}
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
                    <option value="">Select an area…</option>
                    {boundedAreaOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose the workflow scope so we can suggest relevant document types.
                  </p>
                </div>

                {/* Target Object */}
                <div>
                  <label htmlFor="targetObject" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Object *
                  </label>
                  <div className="relative">
                    <select
                      id="targetObject"
                      value={formData.targetObject}
                      onChange={(e) => handleInputChange('targetObject', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={!formData.boundedArea || loadingObjects}
                    >
                      <option value="">
                        {!formData.boundedArea
                          ? 'Select a bounded area first…'
                          : loadingObjects
                          ? 'Loading objects…'
                          : 'Select a target object…'}
                      </option>
                      {availableObjects.map((obj) => (
                        <option key={obj.name} value={obj.name}>
                          {obj.description ? `${obj.description}` : obj.name}
                        </option>
                      ))}
                      <option value="custom">Custom (specify in instructions)</option>
                    </select>
                    {loadingObjects && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.boundedArea
                      ? `Showing ${availableObjects.length} suggestion${
                          availableObjects.length === 1 ? '' : 's'
                        } for “${formData.boundedArea}”.`
                      : 'Select a bounded area to see suggested objects'}
                  </p>
                </div>

                {/* Instructions */}
                <div>
                  <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                    Task Instructions *
                  </label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    placeholder="Be explicit: source (folder/bucket), filters (date, terms), fields to extract, output format (JSONL/XLSX/CSV), and post‑steps (translate, QA, export)."
                    className="min-h-[120px] resize-none"
                    maxLength={500}
                    required
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">{characterCount}/500 characters</span>
                    <span className="text-sm text-gray-500">
                      {characterCount < 10 ? 'Minimum 10 characters required' : 'Good length'}
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <Button type="submit" className="w-full" disabled={isSubmitting || characterCount < 10}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting Task…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Document Task
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Available Objects */}
          {formData.boundedArea && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Database className="w-5 h-5" />
                  Suggested Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingObjects ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600">Loading…</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {availableObjects.length} suggestion{availableObjects.length === 1 ? '' : 's'} for{' '}
                      {formData.boundedArea}
                    </p>
                    {availableObjects.length > 0 && (
                      <div className="max-h-32 overflow-y-auto">
                        <div className="space-y-1">
                          {availableObjects.slice(0, 6).map((obj) => (
                            <div key={obj.name} className="text-xs text-gray-500">
                              • {obj.description || obj.name}
                            </div>
                          ))}
                          {availableObjects.length > 6 && (
                            <div className="text-xs text-gray-400">
                              …and {availableObjects.length - 6} more
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
              {exampleInstructions.map((ex, i) => (
                <div
                  key={i}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleInputChange('instructions', ex)}
                >
                  <p className="text-sm text-gray-700">{ex}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tips for Better Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Specify source location (folder/bucket/collection) and file types.</li>
                <li>• Add filters: date ranges, keywords, suppliers, languages.</li>
                <li>• List the exact fields/tables to extract and expected schema.</li>
                <li>• Declare output: JSONL/CSV/XLSX, and any post‑processing (translate, QA, export).</li>
                <li>• Mention thresholds for QA (e.g., variance &gt; 0.5%).</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
