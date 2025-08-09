import "server-only";
import { StackServerApp } from "@stackframe/stack";

const baseApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    accountSettings: "/settings",
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
    afterSignOut: "/",
  },
});

export const stackServerApp = (baseApp);
