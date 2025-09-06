// app/submit-task/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

const targetObjectOptions = [
  { value: "invoice", label: "Invoice" },
  { value: "receipt", label: "Receipt" },
  { value: "contract", label: "Contract" },
  { value: "form", label: "Form" },
  { value: "report", label: "Report" },
  { value: "other", label: "Other Document" }
];

const boundedAreaOptions = [
  { value: "full_document", label: "Full Document" },
  { value: "header", label: "Header Section" },
  { value: "body", label: "Body Content" },
  { value: "footer", label: "Footer Section" },
  { value: "table", label: "Table Data" },
  { value: "specific_field", label: "Specific Field" }
];

export default function SubmitTaskPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    targetObject: "",
    boundedArea: "",
    instructions: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.targetObject || !formData.boundedArea || !formData.instructions.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit request");
      }

      const result = await response.json();
      
      if (result.success) {
        // Redirect to dashboard with success message
        router.push("/dashboard?submitted=true");
      } else {
        throw new Error(result.error || "Failed to submit request");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      alert(error instanceof Error ? error.message : "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Submit AI Agent Task</h1>
              <p className="text-gray-600 mt-2">
                Create a new document processing request for our AI agents
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Target Object */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {targetObjectOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleInputChange("targetObject", option.value)}
                          className={`p-3 text-sm border rounded-lg transition-colors ${
                            formData.targetObject === option.value
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bounded Area */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Processing Area
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {boundedAreaOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleInputChange("boundedArea", option.value)}
                          className={`p-3 text-sm border rounded-lg transition-colors ${
                            formData.boundedArea === option.value
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                      Processing Instructions
                    </label>
                    <textarea
                      id="instructions"
                      rows={6}
                      value={formData.instructions}
                      onChange={(e) => handleInputChange("instructions", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe what you want the AI agent to extract or analyze from your documents. Be as specific as possible about the fields, format, or processing requirements..."
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Provide detailed instructions for the AI agent. Include specific fields to extract, 
                      formatting requirements, or any special processing needs.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !formData.targetObject || !formData.boundedArea || !formData.instructions.trim()}
                      className="min-w-[120px]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Task
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Document Type</p>
                  <p className="text-sm text-gray-900">
                    {formData.targetObject ? 
                      targetObjectOptions.find(opt => opt.value === formData.targetObject)?.label || formData.targetObject
                      : "Not selected"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Processing Area</p>
                  <p className="text-sm text-gray-900">
                    {formData.boundedArea ? 
                      boundedAreaOptions.find(opt => opt.value === formData.boundedArea)?.label || formData.boundedArea
                      : "Not selected"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Instructions</p>
                  <p className="text-sm text-gray-900">
                    {formData.instructions.trim() || "No instructions provided"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Document Types</h4>
                  <p className="text-sm text-gray-600">
                    Choose the type of document you want to process for better AI accuracy.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Processing Areas</h4>
                  <p className="text-sm text-gray-600">
                    Select which part of the document should be analyzed by the AI agent.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Instructions</h4>
                  <p className="text-sm text-gray-600">
                    Be specific about what data you want extracted and how it should be formatted.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

