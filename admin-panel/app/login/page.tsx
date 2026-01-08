"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { MessageSquare, Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<"login" | "register">("login");
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
    });
    const [error, setError] = useState("");
    const router = useRouter();

    const handleGoogleLogin = () => {
        setIsLoading(true);
        // Redirect to backend Google Auth
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        window.location.href = `${apiUrl}/auth/google`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            if (mode === "register") {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || "Registration failed");
                }

                // If registration successful, automatically login
                setMode("login");
            }

            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
                callbackUrl: "/chats",
            });

            if (result?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/chats");
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--surface-muted))] p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[rgb(var(--primary))]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[rgb(var(--primary))]/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-sm relative animate-fade-in">
                {/* Logo */}
                <div className="flex flex-col items-center justify-center mb-8 gap-3">
                    <div className="w-16 h-16 bg-white rounded-[22px] flex items-center justify-center shadow-xl shadow-black/10 overflow-hidden border border-black/5">
                        <img src="/icon.svg" alt="Chtq" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-2xl font-bold text-[rgb(var(--foreground))] tracking-tight">Chtq</span>
                </div>

                {/* Card */}
                <div className="bg-[rgb(var(--surface))] rounded-3xl border border-[rgb(var(--border))] shadow-xl shadow-black/5 p-8 transition-all duration-300">
                    <div className="text-center mb-8">
                        <h1 className="text-xl font-semibold text-[rgb(var(--foreground))] mb-2">
                            {mode === "login" ? "Welcome Back" : "Create Account"}
                        </h1>
                        <p className="text-sm text-[rgb(var(--foreground-secondary))]">
                            {mode === "login" ? "Sign in to access your dashboard" : "Join us to start managing your chats"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === "register" && (
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Your full name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-[rgb(var(--surface-muted))] border-[rgb(var(--border))] rounded-xl"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-[rgb(var(--surface-muted))] border-[rgb(var(--border))] rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="bg-[rgb(var(--surface-muted))] border-[rgb(var(--border))] rounded-xl pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--foreground))]"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs text-red-500 mt-2 text-center animate-in fade-in slide-in-from-top-1">
                                {error}
                            </p>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 bg-[rgb(var(--primary))] text-white hover:bg-[rgb(var(--primary-hover))] rounded-xl font-medium shadow-md shadow-[rgb(var(--primary))]/20 disabled:opacity-50 transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                                mode === "login" ? "Sign In" : "Create Account"
                            )}
                        </Button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-[rgb(var(--border))]" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[rgb(var(--surface))] px-4 text-[rgb(var(--foreground-secondary))]">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        className="w-full h-11 bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-muted))] rounded-xl font-medium transition-smooth flex items-center justify-center gap-3"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Google</span>
                    </Button>

                    <p className="mt-8 text-center text-sm text-[rgb(var(--foreground-secondary))]">
                        {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                        <button
                            onClick={() => {
                                setMode(mode === "login" ? "register" : "login");
                                setError("");
                            }}
                            className="text-[rgb(var(--primary))] font-medium hover:underline"
                        >
                            {mode === "login" ? "Sign up" : "Sign in"}
                        </button>
                    </p>
                </div>

                <p className="mt-8 text-center text-xs text-[rgb(var(--foreground-secondary))]">
                    © 2026 Chtq. All rights reserved.
                </p>
            </div>
        </div>
    );
}
