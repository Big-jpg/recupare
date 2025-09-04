// app/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { FileText, Search, Languages, Bot, Upload, Zap } from 'lucide-react';

export default function LandingPage() {
  const [agentSystemStatus, setAgentSystemStatus] = useState<{
    database: string;
    agents: string;
    userCount: number;
  } | null>(null);

  useEffect(() => {
    // Check agentic system status
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setAgentSystemStatus({
          database: data.database?.connected ? 'Connected' : 'Disconnected',
          agents: data.services?.openaiAgents ? 'Ready' : 'Not Ready',
          userCount: data.database?.userCount || 0,
        });
      })
      .catch(() => {
        setAgentSystemStatus({
          database: 'Error',
          agents: 'Error',
          userCount: 0,
        });
      });
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-6">
              Agentic Document Intelligence
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Retrieve → Parse → Translate. Process invoices with Azure OCR, extract structured fields, 
              translate across languages, and automate reviews with AI agents.
              <span className="block mt-2 font-medium">
                Built for fast retrieval, accurate extraction, and human-in-the-loop control.
              </span>
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/auth/signin">
                <Button size="lg" className="text-lg px-8 py-3">
                  Get Started
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Invoice Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upload PDF invoices and extract structured data using Azure Content Understanding. 
                  Automatic field detection and validation.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Retrieval & Search</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Vector search (RAG) over your documents for instant grounding and context-aware answers.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>OCR & Parsing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Extract tables and fields from PDFs and images with schema mapping and validation.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Languages className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Translation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Translate documents between languages with quality checks and human review workflows.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle>AI Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Orchestrate multi-step workflows with agentic AI for complex document processing tasks.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-blue-900">Stack Auth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700">
                  Secure authentication with magic links, social login, and user management built-in.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* System Status */}
      {agentSystemStatus && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {agentSystemStatus.database}
                    </div>
                    <div className="text-sm text-blue-700">Database</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {agentSystemStatus.agents}
                    </div>
                    <div className="text-sm text-blue-700">AI Agents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {agentSystemStatus.userCount}
                    </div>
                    <div className="text-sm text-blue-700">Users</div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-sm text-blue-600">
                    Ready to process your document workflows with AI assistance
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Document Workflows?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who trust our AI-powered document intelligence platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

