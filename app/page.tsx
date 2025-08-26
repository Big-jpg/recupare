// app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Brain, Zap, Shield, ArrowRight, CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Recupare</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/handler/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/handler/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Agentic Document
            <span className="text-blue-600"> Intelligence</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your document workflows with AI agents that retrieve, parse, translate, 
            and process documents across multiple expertise areas automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/handler/signup">
                Start Processing Documents
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Intelligent Document Processing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI agents handle complex document workflows across multiple expertise areas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Multi-Format Support</CardTitle>
                <CardDescription>
                  Process PDFs, images, text files, and more with intelligent parsing
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Brain className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle>AI Agents</CardTitle>
                <CardDescription>
                  Specialized agents for HR, Contracts, Finance, and other domains
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Zap className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <CardTitle>Automated Workflows</CardTitle>
                <CardDescription>
                  From upload to processing to output - fully automated pipelines
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  Secure document handling with user permissions and audit trails
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Expertise Areas */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Expertise Areas
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Specialized AI agents for different business domains
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              'Human Resources',
              'Contract Management',
              'Finance & Accounting',
              'Communications',
              'Corporate Governance',
              'Accounts Payable',
              'Operations',
              'IT Documentation'
            ].map((area) => (
              <div key={area} className="flex items-center p-4 bg-white rounded-lg shadow-sm">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <span className="font-medium text-gray-900">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Document Workflows?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join organizations already using Recupare to automate their document processing
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/handler/signup">
              Get Started Today
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold">Recupare</span>
          </div>
          <p className="text-gray-400">
            Agentic Document Intelligence Platform
          </p>
          <p className="text-gray-500 text-sm mt-4">
            © 2025 Recupare. Built with Next.js and OpenAI Agents.
          </p>
        </div>
      </footer>
    </div>
  );
}

