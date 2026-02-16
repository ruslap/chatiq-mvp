
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
                password: { label: "Password", type: "password" },
                token: { label: "Token", type: "text" }
            },
            async authorize(credentials) {
                // Scenario 1: Login with Token (from Backend Google Auth)
                if (credentials?.token) {
                    try {
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/profile`, {
                            headers: {
                                'Authorization': `Bearer ${credentials.token}`
                            }
                        });

                        if (res.ok) {
                            const userProfile = await res.json();
                            return {
                                id: userProfile.userId,
                                email: userProfile.email,
                                name: userProfile.name || userProfile.email.split('@')[0],
                                accessToken: credentials.token,
                            };
                        }
                    } catch (error) {
                        console.error("Token validation failed", error);
                    }
                    return null;
                }

                // Scenario 2: Login with Email/Password
                if (!credentials?.email || !credentials?.password) return null;

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/login`, {
                    method: 'POST',
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password
                    }),
                    headers: { "Content-Type": "application/json" }
                });

                const data = await res.json();

                if (res.ok && data.access_token) {
                    // We need to fetch user details or decode token if the login response doesn't have user info
                    // Check if data.user exists (based on previous code it does)
                    if (data.user) {
                        return {
                            id: data.user.id,
                            name: data.user.name,
                            email: data.user.email,
                            accessToken: data.access_token,
                        };
                    }

                    // Fallback to profile fetch
                    const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/profile`, {
                        headers: {
                            'Authorization': `Bearer ${data.access_token}`
                        }
                    });
                    if (profileRes.ok) {
                        const userProfile = await profileRes.json();
                        return {
                            id: userProfile.userId,
                            email: userProfile.email,
                            name: userProfile.name,
                            accessToken: data.access_token,
                        };
                    }
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
            // Only use account.access_token if it exists AND we don't already have a token
            // This prevents overwriting the backend JWT with Google's access token
            if (account?.access_token && !token.accessToken) {
                token.accessToken = account.access_token;
            }
            return token;
        },
    },
    session: {
        strategy: "jwt",
    },
    debug: process.env.NODE_ENV === 'development',
};
