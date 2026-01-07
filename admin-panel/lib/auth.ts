
import { NextAuthOptions, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

interface ExtendedUser {
    id: string;
    name?: string | null;
    email?: string | null;
    accessToken?: string;
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
            clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/login`, {
                    method: 'POST',
                    body: JSON.stringify(credentials),
                    headers: { "Content-Type": "application/json" }
                });

                const data = await res.json();

                if (res.ok && data.user) {
                    return {
                        id: data.user.id,
                        name: data.user.name,
                        email: data.user.email,
                        accessToken: data.access_token,
                    };
                }
                return null;
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async session({ session, token }: { session: Session; token: JWT }) {
            if (session.user) {
                (session.user as ExtendedUser).id = token.id as string;
                (session as Session & { accessToken?: string }).accessToken = token.accessToken as string;
            }
            return session;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                const extendedUser = user as ExtendedUser;
                if (extendedUser.accessToken) {
                    token.accessToken = extendedUser.accessToken;
                }
            }
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
    },
    session: {
        strategy: "jwt",
    },
    debug: process.env.NODE_ENV === 'development' || true, // Тимчасово вмикаємо для дебагу в продакшені
};
