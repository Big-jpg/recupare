'use client';
import { SignUp } from '@stackframe/stack';

export default function SignUpPage() {
  return (
    <div>
      <h1>Sign Up</h1>
      <SignUp fullPage={true} automaticRedirect={true} firstTab="magic-link" />
    </div>
  );
}
