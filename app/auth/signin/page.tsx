'use client';
import { SignIn } from '@stackframe/stack';

export default function SignInPage() {
  return (
    <div>
      <SignIn fullPage={true} automaticRedirect={true} firstTab="magic-link" />
    </div>
  );
}
