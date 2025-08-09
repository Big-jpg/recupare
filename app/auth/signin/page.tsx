'use client';
import { SignIn } from '@stackframe/stack';

export default function SignInPage() {
  return (
    <div>
      <h1>Sign In</h1>
      <SignIn fullPage={true} automaticRedirect={true} firstTab="magic-link" />
    </div>
  );
}
