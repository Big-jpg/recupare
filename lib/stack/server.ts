// lib/stack.ts (server-only)
import "server-only";
import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",            // required
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY!, // required
});
