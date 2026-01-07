"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarNav } from "@/components/sidebar-nav";
import {
    Globe,
    Plus,
    Copy,
    Settings,
    ExternalLink,
    MessageSquare,
    Zap,
    Clock,
    AlertCircle,
    Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Site {
    id: string;
    name: string;
    domain: string;
    apiKey: string;
    stats?: {
        chats: number;
        activeAutoReplies: number;
        activeTemplates: number;
        businessHoursEnabled: boolean;
    };
}

export default function SitesPage() {
    const { data: session } = useSession();
    const [sites, setSites] = useState<Site[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [formData, setFormData] = useState({ name: "", domain: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (session?.accessToken) {
            fetchSites();
        }
    }, [session]);

    const fetchSites = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sites`, {
                headers: {
                    'Authorization': `Bearer ${session?.accessToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setSites(data);
            }
        } catch (error) {
            console.error("Failed to fetch sites:", error);
            setError("Не вдалося завантажити сайти");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSite = async () => {
        if (!formData.name || !formData.domain) return;

        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const newSite = await res.json();
                setSites([...sites, { ...newSite, stats: { chats: 0, activeAutoReplies: 0, activeTemplates: 0, businessHoursEnabled: false } }]);
                setShowNew(false);
                setFormData({ name: "", domain: "" });
            } else {
                setError("Помилка при створенні сайту");
            }
        } catch (error) {
            console.error(error);
            setError("Помилка з'єднання");
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add toast here
    };

    return (
        <div className="h-screen w-full flex bg-[rgb(var(--surface))] overflow-hidden selection:bg-[rgb(var(--primary))]/20">
            <SidebarNav />

            <div className="flex-1 overflow-y-auto bg-[rgb(var(--surface-muted))] scrollbar-thin">
                {/* Header */}
                <header className="h-16 border-b border-[rgb(var(--border))] px-8 flex justify-between items-center bg-[rgb(var(--surface))] sticky top-0 z-10">
                    <div>
                        <h1 className="font-semibold text-base text-[rgb(var(--foreground))]">Мої сайти</h1>
                        <p className="text-xs text-[rgb(var(--foreground-secondary))]">Керування підключеними веб-ресурсами</p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setShowNew(!showNew)}
                        className="bg-[rgb(var(--primary))] text-white hover:bg-[rgb(var(--primary-600))] font-medium text-xs h-9 px-4 rounded-xl transition-smooth"
                    >
                        {showNew ? "Скасувати" : (
                            <>
                                <Plus className="w-4 h-4 mr-1.5" />
                                Додати сайт
                            </>
                        )}
                    </Button>
                </header>

                <div className="p-8 max-w-5xl">

                    <BasicInfoCard />

                    {/* New Site Form */}
                    {showNew && (
                        <Card className="mb-8 border border-[rgb(var(--border))] shadow-sm bg-[rgb(var(--surface))] animate-fade-in">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-[rgb(var(--foreground))]">Реєстрація нового сайту</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="text-xs font-medium text-[rgb(var(--foreground-secondary))]">Назва сайту</Label>
                                        <Input
                                            id="name"
                                            placeholder="Наприклад: Мій Магазин"
                                            className="rounded-xl border-[rgb(var(--border))] focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="domain" className="text-xs font-medium text-[rgb(var(--foreground-secondary))]">Домен</Label>
                                        <Input
                                            id="domain"
                                            placeholder="example.com"
                                            className="rounded-xl border-[rgb(var(--border))] focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50"
                                            value={formData.domain}
                                            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                        />
                                    </div>
                                    {error && <p className="text-red-500 text-xs">{error}</p>}
                                    <Button
                                        onClick={handleCreateSite}
                                        disabled={isSubmitting}
                                        className="bg-[rgb(var(--primary))] text-white rounded-xl font-medium h-10 transition-smooth hover:bg-[rgb(var(--primary-600))]"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Створити сайт"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--primary))]" />
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && sites.length === 0 && !showNew && (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                            <div className="w-16 h-16 bg-[rgb(var(--accent))] rounded-2xl flex items-center justify-center mb-4 animate-float">
                                <Globe className="w-7 h-7 text-[rgb(var(--primary))]" />
                            </div>
                            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2">У вас ще немає сайтів</h2>
                            <p className="text-sm text-[rgb(var(--foreground-secondary))] max-w-sm mb-6">
                                Сайт в системі — це точка входу для ваших відвідувачів. Підключіть свій веб-ресурс, щоб почати спілкування.
                            </p>
                            <Button
                                onClick={() => setShowNew(true)}
                                className="bg-[rgb(var(--primary))] text-white rounded-xl font-medium h-10 px-5 transition-smooth hover:bg-[rgb(var(--primary-600))]"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Додати перший сайт
                            </Button>
                        </div>
                    )}

                    {/* Sites Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {sites.map(site => (
                            <Card key={site.id} className="border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-sm hover:shadow-md transition-smooth group flex flex-col">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[rgb(var(--surface-muted))] flex items-center justify-center text-[rgb(var(--primary))]">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold text-[rgb(var(--foreground))]">
                                                {site.name}
                                            </CardTitle>
                                            <a
                                                href={`https://${site.domain}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--primary))] flex items-center gap-1 transition-colors"
                                            >
                                                {site.domain}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>

                                    <Link href={`/settings?site=${site.id}`}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-lg text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-muted))]"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </CardHeader>

                                <CardContent className="flex-1 flex flex-col gap-4">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-xl bg-[rgb(var(--surface-muted))] border border-[rgb(var(--border))]">
                                            <div className="flex items-center gap-2 mb-1 text-[rgb(var(--foreground-secondary))]">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-medium uppercase tracking-wider">Чати</span>
                                            </div>
                                            <p className="text-xl font-semibold text-[rgb(var(--foreground))]">{site.stats?.chats || 0}</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-[rgb(var(--surface-muted))] border border-[rgb(var(--border))]">
                                            <div className="flex items-center gap-2 mb-1 text-[rgb(var(--foreground-secondary))]">
                                                <Zap className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-medium uppercase tracking-wider">Автоматизація</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-[rgb(var(--foreground))]">
                                                    {site.stats?.activeAutoReplies || 0} автовідповідей
                                                </span>
                                                <span className="text-xs text-[rgb(var(--foreground-secondary))]">
                                                    {site.stats?.activeTemplates || 0} активних шаблонів
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Business Hours Status */}
                                    <div className="flex items-center gap-2 text-xs py-2 px-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))]/50">
                                        <Clock className="w-3.5 h-3.5 text-[rgb(var(--foreground-secondary))]" />
                                        <span className="text-[rgb(var(--foreground-secondary))]">Розклад роботи:</span>
                                        <Badge variant="outline" className={`h-5 text-[10px] px-1.5 ${site.stats?.businessHoursEnabled ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                                            {site.stats?.businessHoursEnabled ? 'Увімкнено' : 'Вимкнено'}
                                        </Badge>
                                    </div>

                                    <div className="mt-auto pt-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-center p-3 bg-[rgb(var(--surface-muted))] rounded-xl border border-[rgb(var(--border))]">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] font-medium text-[rgb(var(--foreground-secondary))] uppercase tracking-wider">API Key</span>
                                                <span className="text-xs font-medium text-[rgb(var(--foreground))] font-mono">
                                                    {site.apiKey.substring(0, 8)}...
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(site.apiKey)}
                                                className="p-1.5 hover:bg-[rgb(var(--surface))] rounded-lg transition-colors text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--primary))]"
                                                title="Копіювати ключ"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function BasicInfoCard() {
    return (
        <div className="mb-6 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
                <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400">Що таке "Сайт"?</h3>
                <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
                    Сайт – це окрема конфігурація чату для вашого веб-ресурсу.
                    Він має свій унікальний API Key, власні налаштування кольорів, привітань,
                    автоматичних відповідей та розкладу роботи. Ви можете додати декілька сайтів для різних проектів.
                </p>
            </div>
        </div>
    );
}
