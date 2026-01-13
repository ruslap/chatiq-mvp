"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileHeader, MobileBottomNav } from "@/components/mobile-nav";
import { Mail, Phone, MessageSquare, Trash2, Calendar } from "lucide-react";
import { getMyOrganization } from "@/lib/organization";
import { getApiUrl } from "@/lib/api-config";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";

interface ContactLead {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    message?: string;
    createdAt: string;
}

export default function LeadsPage() {
    const { data: session, status } = useSession();
    const [leads, setLeads] = useState<ContactLead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [siteId, setSiteId] = useState<string>("");
    const API_URL = getApiUrl();
    const { language } = useLanguage();
    const t = useTranslation(language);

    useEffect(() => {
        const fetchSiteId = async () => {
            if (!session?.user) return;
            const org = await getMyOrganization();
            if (org?.siteId) {
                setSiteId(org.siteId);
            }
        };
        fetchSiteId();
    }, [session]);

    useEffect(() => {
        const fetchLeads = async () => {
            if (!siteId || !session) return;

            try {
                const response = await fetch(`${API_URL}/leads/site/${siteId}`, {
                    headers: {
                        Authorization: `Bearer ${(session as any).accessToken}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setLeads(data);
                }
            } catch (error) {
                console.error("Failed to fetch leads:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeads();
    }, [siteId, session, API_URL]);

    const handleDelete = async (id: string) => {
        if (!confirm(t.leads.deleteConfirm)) return;

        try {
            const response = await fetch(`${API_URL}/leads/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${(session as any).accessToken}`,
                },
            });

            if (response.ok) {
                setLeads(leads.filter((lead) => lead.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete lead:", error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("uk-UA", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-[rgb(var(--foreground-secondary))]">{t.leads.loading}</div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[rgb(var(--background))]">
            <SidebarNav />

            <div className="flex flex-1 flex-col overflow-hidden">
                <MobileHeader />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-6">
                            <h1 className="text-2xl font-semibold text-[rgb(var(--foreground))]">
                                {t.leads.title}
                            </h1>
                            <p className="text-[rgb(var(--foreground-secondary))] mt-1">
                                {t.leads.subtitle}
                            </p>
                        </div>

                        {leads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <MessageSquare
                                    className="h-12 w-12 text-[rgb(var(--foreground-tertiary))] mb-4"
                                    strokeWidth={1.5}
                                />
                                <p className="text-[rgb(var(--foreground-secondary))]">
                                    {t.leads.noLeads}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {leads.map((lead) => (
                                    <div
                                        key={lead.id}
                                        className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 transition-shadow hover:shadow-md"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">
                                                        {lead.name}
                                                    </h3>
                                                    <span className="flex items-center gap-1 text-xs text-[rgb(var(--foreground-tertiary))]">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(lead.createdAt)}
                                                    </span>
                                                </div>

                                                <div className="space-y-2">
                                                    {lead.email && (
                                                        <div className="flex items-center gap-2 text-sm text-[rgb(var(--foreground-secondary))]">
                                                            <Mail className="h-4 w-4" />
                                                            <a
                                                                href={`mailto:${lead.email}`}
                                                                className="hover:text-[rgb(var(--primary))] transition-colors"
                                                            >
                                                                {lead.email}
                                                            </a>
                                                        </div>
                                                    )}

                                                    {lead.phone && (
                                                        <div className="flex items-center gap-2 text-sm text-[rgb(var(--foreground-secondary))]">
                                                            <Phone className="h-4 w-4" />
                                                            <a
                                                                href={`tel:${lead.phone}`}
                                                                className="hover:text-[rgb(var(--primary))] transition-colors"
                                                            >
                                                                {lead.phone}
                                                            </a>
                                                        </div>
                                                    )}

                                                    {lead.message && (
                                                        <div className="mt-3 rounded-md bg-[rgb(var(--background))] p-3">
                                                            <p className="text-sm text-[rgb(var(--foreground-secondary))] whitespace-pre-wrap">
                                                                {lead.message}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDelete(lead.id)}
                                                className="ml-4 rounded-md p-2 text-[rgb(var(--foreground-tertiary))] hover:bg-[rgb(var(--background))] hover:text-red-500 transition-colors"
                                                title={t.leads.deleteLead}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                <MobileBottomNav />
            </div>
        </div>
    );
}
