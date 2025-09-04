// lib/stack.ts
import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
});

// Helper function to get current user on server side
export async function getCurrentUser() {
  try {
    const user = await stackServerApp.getUser();
    return user;
  } catch {
    return null;
  }
}

// Helper function to require authentication
export async function requireAuth() {
  const user = await stackServerApp.getUser({ or: 'redirect' });
  return user;
}

