// app/auth/signup/page.tsx
'use client';
import { SignUp } from '@stackframe/stack';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h1>
          <p className="text-gray-600">Create your Recupare account</p>
        </div>
        <SignUp fullPage={false} automaticRedirect={true} firstTab="magic-link" />
      </div>
    </div>
  );
}
