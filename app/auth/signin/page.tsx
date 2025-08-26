// app/auth/signin/page.tsx
'use client';
import { SignIn } from '@stackframe/stack';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your Recupare account</p>
        </div>
        <SignIn fullPage={false} automaticRedirect={true} firstTab="magic-link" />
      </div>
    </div>
  );
}
