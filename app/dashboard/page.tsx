// app/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Request {
  id: string;
  targetObject: string;
  boundedArea: string;
  instructions: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'escalated';
  result: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface RequestsResponse {
  error: string;
  success: boolean;
  requests: Request[];
  count: number;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Pending',
  },
  processing: {
    icon: RefreshCw,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Processing',
  },
  completed: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Failed',
  },
  escalated: {
    icon: AlertCircle,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    label: 'Escalated',
  },
};

const targetObjectLabels: Record<string, string> = {
  sales_data: 'Sales Data',
  finance_data: 'Finance Data',
  customer_data: 'Customer Data',
  inventory_data: 'Inventory Data',
  hr_data: 'HR Data',
};

const boundedAreaLabels: Record<string, string> = {
  sales: 'Sales',
  finance: 'Finance',
  marketing: 'Marketing',
  operations: 'Operations',
  hr: 'Human Resources',
  executive: 'Executive',
};

export default function EnhancedDashboard() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
    try {
      const response = await fetch('/api/requests');
      const data: RequestsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch requests');
      }

      setRequests(data.requests);
      setError(null);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: Request['status']) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Agent Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Monitor your submitted tasks and their processing status
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => fetchRequests(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/submit-task">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Submit New Task
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'processing').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Card className="p-6 mb-8 border-red-200 bg-red-50">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </Card>
        )}

        {/* Requests List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Requests</h2>
          
          {requests.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests yet</h3>
              <p className="text-gray-600 mb-6">
                Submit your first AI agent task to get started with automated data analysis.
              </p>
              <Link href="/submit-task">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Your First Task
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {targetObjectLabels[request.targetObject] || request.targetObject}
                        </h3>
                        <Badge variant="secondary">
                          {boundedAreaLabels[request.boundedArea] || request.boundedArea}
                        </Badge>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {request.instructions}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>Submitted {formatDate(request.createdAt)}</span>
                        {request.updatedAt !== request.createdAt && (
                          <span className="ml-4">
                            Updated {formatDate(request.updatedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Result Preview */}
                  {request.result && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Result Preview</h4>
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(request.result, null, 2).substring(0, 200)}
                        {JSON.stringify(request.result, null, 2).length > 200 && '...'}
                      </pre>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

