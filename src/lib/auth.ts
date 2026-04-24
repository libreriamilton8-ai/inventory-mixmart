import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";

import type { UserRole } from "../../prisma/generated/client";
import prisma from "./prisma";
import { verifyPassword } from "./password";

const DEFAULT_AUTHENTICATED_PATH = "/dashboard";
const SIGN_IN_PATH = "/login";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isSafeRelativePath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

export function getSafeCallbackUrl(value: string | string[] | undefined) {
  const callbackUrl = Array.isArray(value) ? value[0] : value;

  if (callbackUrl && isSafeRelativePath(callbackUrl)) {
    return callbackUrl;
  }

  return DEFAULT_AUTHENTICATED_PATH;
}

export function getSignInPath(callbackUrl?: string) {
  if (!callbackUrl || callbackUrl === DEFAULT_AUTHENTICATED_PATH) {
    return SIGN_IN_PATH;
  }

  const params = new URLSearchParams({ callbackUrl });
  return `${SIGN_IN_PATH}?${params.toString()}`;
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: SIGN_IN_PATH,
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      name: "Correo y contraseña",
      credentials: {
        email: {
          label: "Correo",
          type: "email",
          placeholder: "correo@ejemplo.com",
        },
        password: {
          label: "Contraseña",
          type: "password",
        },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            email: normalizeEmail(email),
            isActive: true,
          },
        });

        if (!user) {
          return null;
        }

        const isValidPassword = await verifyPassword(password, user.passwordHash);

        if (!isValidPassword) {
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = token.role as UserRole;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession(callbackUrl = DEFAULT_AUTHENTICATED_PATH) {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect(getSignInPath(callbackUrl));
  }

  return session as Session & {
    user: NonNullable<Session["user"]> & {
      id: string;
      role: UserRole;
    };
  };
}

export async function requireActiveUser(callbackUrl = DEFAULT_AUTHENTICATED_PATH) {
  const session = await requireSession(callbackUrl);
  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  if (!user) {
    redirect(getSignInPath(callbackUrl));
  }

  return user;
}

export async function requireRole(
  allowedRoles: UserRole[],
  callbackUrl = DEFAULT_AUTHENTICATED_PATH,
) {
  const user = await requireActiveUser(callbackUrl);

  if (!allowedRoles.includes(user.role)) {
    redirect(DEFAULT_AUTHENTICATED_PATH);
  }

  return user;
}
