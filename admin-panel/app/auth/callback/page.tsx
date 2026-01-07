"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState("");

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            signIn("credentials", {
                token,
                redirect: false,
                callbackUrl: "/chats"
            }).then((result) => {
                if (result?.error) {
                    setError("Failed to login with token");
                    setTimeout(() => router.push("/login"), 2000);
                } else {
                    router.push("/chats");
                }
            });
        } else {
            setError("No token provided");
            setTimeout(() => router.push("/login"), 2000);
        }
    }, [searchParams, router]);

    return (
        <div className="flex flex-col items-center gap-4">
            {error ? (
                <div className="text-red-500 font-medium">{error}</div>
            ) : (
                <>
                    <Loader2 className="w-10 h-10 text-[rgb(var(--primary))] animate-spin" />
                    <div className="text-sm font-medium text-[rgb(var(--foreground-secondary))]">
                        Authenticating...
                    </div>
                </>
            )}
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-[rgb(var(--surface-muted))]">
            <Suspense fallback={<Loader2 className="w-10 h-10 text-[rgb(var(--primary))] animate-spin" />}>
                <AuthCallbackContent />
            </Suspense>
        </div>
    );
}
