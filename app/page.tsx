'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

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
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-16 space-y-16">
      {/* Hero Section */}
      <section className="text-center max-w-3xl space-y-6">
        <Image
          src="/logo.png" // Place branding logo here
          alt="Agentic Document Intelligence Logo"
          width={64}
          height={64}
          className="mx-auto"
        />
        <h1 className="text-4xl font-bold tracking-tight">
          Agentic Document Intelligence
        </h1>
        <p className="text-muted-foreground text-lg">
          Retrieve → Parse → Translate. Ingest PDFs, images, and text; extract structured fields; translate across languages; and automate reviews with AI agents.
          <span className="block mt-2 font-medium">
            Built for fast retrieval, accurate extraction, and human-in-the-loop control.
          </span>
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <Link href="/auth/signin">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="lg" variant="outline">Create Account</Button>
          </Link>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="max-w-5xl mx-auto">
        <Image
          src="/preview-dashboard.png"
          alt="Document workflow dashboard preview with retrieval, parsing, and translation status"
          width={1024}
          height={600}
          className="rounded-lg shadow-lg border"
        />
      </section>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
        <div className="p-6 border rounded-lg shadow-sm bg-card">
          <h2 className="text-lg font-semibold mb-2">Retrieval & Search</h2>
          <p className="text-sm text-muted-foreground">
            Vector search (RAG) over your docs for instant grounding and context-aware answers.
          </p>
        </div>
        <div className="p-6 border rounded-lg shadow-sm bg-card">
          <h2 className="text-lg font-semibold mb-2">Magic Link Auth</h2>
          <p className="text-sm text-muted-foreground">
            Sign in using email-only, secure passwordless links. No passwords to forget.
          </p>
        </div>
        <div className="p-6 border rounded-lg shadow-sm bg-card">
          <h2 className="text-lg font-semibold mb-2">Parsing & OCR</h2>
          <p className="text-sm text-muted-foreground">
            Extract tables and fields from PDFs and images with schema mapping and validation.
          </p>
        </div>
        <div className="p-6 border rounded-lg shadow-sm bg-card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <h2 className="text-lg font-semibold mb-2 text-blue-900">🌐 Translation & Agents</h2>
          <p className="text-sm text-blue-700">
            Translate between languages and orchestrate multi-step workflows with agentic AI.
          </p>
        </div>
      </section>

      {/* Agentic System Status */}
      {agentSystemStatus && (
        <section className="max-w-4xl w-full">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">
              🚀 Agentic Platform Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="mt-4 text-center">
              <p className="text-sm text-blue-600">
                Ready to process your document workflows with AI assistance
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
