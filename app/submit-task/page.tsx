// app/submit-task/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  FileText, 
  Brain,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface Area {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  areaId: string;
  areaName?: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  areaId: string;
  taskId: string;
  targetObject: string;
  boundedArea: string;
  instructions: string;
}

const steps = [
  { id: 1, name: 'Select Area', description: 'Choose your area of expertise' },
  { id: 2, name: 'Select Task', description: 'Pick the specific task type' },
  { id: 3, name: 'Provide Details', description: 'Add instructions and context' },
  { id: 4, name: 'Review & Submit', description: 'Confirm and submit your request' },
];

export default function SubmitTaskPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    areaId: '',
    taskId: '',
    targetObject: '',
    boundedArea: '',
    instructions: '',
  });

  // Fetch areas on component mount
  useEffect(() => {
    fetchAreas();
  }, []);

  // Fetch tasks when area is selected
  useEffect(() => {
    if (formData.areaId) {
      fetchTasks(formData.areaId);
    }
  }, [formData.areaId]);

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/areas');
      const data = await response.json();
      
      if (data.success) {
        setAreas(data.areas);
      } else {
        setError('Failed to load areas');
      }
    } catch (err) {
      setError('Failed to load areas');
      console.error('Error fetching areas:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (areaId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks?areaId=${areaId}`);
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.tasks);
      } else {
        setError('Failed to load tasks');
      }
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAreaSelect = (areaId: string) => {
    setFormData(prev => ({
      ...prev,
      areaId,
      taskId: '', // Reset task when area changes
    }));
  };

  const handleTaskSelect = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      taskId,
    }));
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.areaId !== '';
      case 2:
        return formData.taskId !== '';
      case 3:
        return formData.targetObject.trim() !== '' && 
               formData.boundedArea.trim() !== '' && 
               formData.instructions.trim().length >= 10;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNextStep() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to dashboard with success message
        router.push('/dashboard?submitted=true');
      } else {
        setError(data.error || 'Failed to submit request');
      }
    } catch (err) {
      setError('Failed to submit request');
      console.error('Error submitting request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedArea = areas.find(area => area.id === formData.areaId);
  const selectedTask = tasks.find(task => task.id === formData.taskId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit New Task</h1>
          <p className="text-gray-600">
            Create a new document processing task for our AI agents
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 ml-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].name}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Select Area */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Loading areas...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {areas.map((area) => (
                      <div
                        key={area.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.areaId === area.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleAreaSelect(area.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{area.name}</h3>
                          {formData.areaId === area.id && (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        {area.description && (
                          <p className="text-sm text-gray-600">{area.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Task */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {selectedArea && (
                  <div className="mb-4">
                    <Badge variant="secondary" className="mb-2">
                      Selected Area: {selectedArea.name}
                    </Badge>
                  </div>
                )}
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Loading tasks...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.taskId === task.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleTaskSelect(task.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{task.name}</h3>
                          {formData.taskId === task.id && (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600">{task.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Provide Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {selectedArea && selectedTask && (
                  <div className="mb-4 space-y-2">
                    <Badge variant="secondary">
                      Area: {selectedArea.name}
                    </Badge>
                    <Badge variant="secondary">
                      Task: {selectedTask.name}
                    </Badge>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Object *
                    </label>
                    <Input
                      placeholder="e.g., contract_documents, employee_handbook, financial_reports"
                      value={formData.targetObject}
                      onChange={(e) => handleInputChange('targetObject', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Specify the type of document or data you want to process
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bounded Area *
                    </label>
                    <Input
                      placeholder="e.g., legal, hr, finance, operations"
                      value={formData.boundedArea}
                      onChange={(e) => handleInputChange('boundedArea', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Define the scope or domain for this task
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructions *
                    </label>
                    <Textarea
                      placeholder="Provide detailed instructions for the AI agent. Include specific requirements, expected output format, and any special considerations..."
                      value={formData.instructions}
                      onChange={(e) => handleInputChange('instructions', e.target.value)}
                      rows={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 10 characters. Be as specific as possible for best results.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-4">Review Your Request</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Area:</span>
                      <p className="text-gray-900">{selectedArea?.name}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Task:</span>
                      <p className="text-gray-900">{selectedTask?.name}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Target Object:</span>
                      <p className="text-gray-900">{formData.targetObject}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Bounded Area:</span>
                      <p className="text-gray-900">{formData.boundedArea}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Instructions:</span>
                      <p className="text-gray-900 whitespace-pre-wrap">{formData.instructions}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <Brain className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">What happens next?</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your request will be assigned to a specialized AI agent that will process 
                        your task according to your instructions. You'll be able to track progress 
                        and communicate with the agent through your dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceedToNextStep() || loading}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Submit Task
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
