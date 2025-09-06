// lib/stack.ts
import "server-only";
import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  // Use cookies for session on the server side of Next.js
  tokenStore: "nextjs-cookie",
  // Let the library read the secret; being explicit avoids surprises:
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY!,
});
