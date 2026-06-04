import { NextAuth, createAuthConfig } from "@imtbl/auth-next-server";

export const { handlers, auth, signIn, signOut } = NextAuth(
  createAuthConfig({
    clientId: process.env.NEXT_PUBLIC_IMMUTABLE_CLIENT_ID!,
    redirectUri: process.env.NEXT_PUBLIC_IMMUTABLE_REDIRECT_URI!,
  })
);
