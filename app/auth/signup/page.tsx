'use client';
import { SignUp } from '@stackframe/stack';

export default function SignUpPage() {
  return (
    <div>
      <SignUp fullPage={true} automaticRedirect={true} firstTab="magic-link" />
    </div>
  );
}
