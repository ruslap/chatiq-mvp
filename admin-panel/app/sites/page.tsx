"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarNav } from "@/components/sidebar-nav";
import { Globe, Plus, Copy, Settings, ExternalLink } from "lucide-react";

export default function SitesPage() {
    const [sites, setSites] = useState([
        { id: "1", name: "My First Shop", domain: "shop.com", apiKey: "key_123" }
    ]);
    const [showNew, setShowNew] = useState(false);

    return (
        <div className="h-screen w-full flex bg-[rgb(var(--surface))] overflow-hidden selection:bg-[rgb(var(--primary))]/20">
            <SidebarNav />

            <div className="flex-1 overflow-y-auto bg-[rgb(var(--surface-muted))] scrollbar-thin">
                {/* Header */}
                <header className="h-16 border-b border-[rgb(var(--border))] px-8 flex justify-between items-center bg-[rgb(var(--surface))] sticky top-0 z-10">
                    <div>
                        <h1 className="font-semibold text-base text-[rgb(var(--foreground))]">Sites</h1>
                        <p className="text-xs text-[rgb(var(--foreground-secondary))]">Manage your connected websites</p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setShowNew(!showNew)}
                        className="bg-[rgb(var(--primary))] text-white hover:bg-[rgb(var(--primary-600))] font-medium text-xs h-9 px-4 rounded-xl transition-smooth"
                    >
                        {showNew ? "Cancel" : (
                            <>
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add Site
                            </>
                        )}
                    </Button>
                </header>

                <div className="p-8 max-w-5xl">
                    {/* New Site Form */}
                    {showNew && (
                        <Card className="mb-8 border border-[rgb(var(--border))] shadow-sm bg-[rgb(var(--surface))] animate-fade-in">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-[rgb(var(--foreground))]">Register New Site</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="text-xs font-medium text-[rgb(var(--foreground-secondary))]">Site Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="Acme Corp"
                                            className="rounded-xl border-[rgb(var(--border))] focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="domain" className="text-xs font-medium text-[rgb(var(--foreground-secondary))]">Domain</Label>
                                        <Input
                                            id="domain"
                                            placeholder="acme.com"
                                            className="rounded-xl border-[rgb(var(--border))] focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50"
                                        />
                                    </div>
                                    <Button className="bg-[rgb(var(--primary))] text-white rounded-xl font-medium h-10 transition-smooth hover:bg-[rgb(var(--primary-600))]">
                                        Create Site
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Empty State */}
                    {sites.length === 0 && !showNew && (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                            <div className="w-16 h-16 bg-[rgb(var(--accent))] rounded-2xl flex items-center justify-center mb-4 animate-float">
                                <Globe className="w-7 h-7 text-[rgb(var(--primary))]" />
                            </div>
                            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2">No sites yet</h2>
                            <p className="text-sm text-[rgb(var(--foreground-secondary))] max-w-sm mb-6">
                                Connect your first website to start receiving chat messages from your visitors.
                            </p>
                            <Button
                                onClick={() => setShowNew(true)}
                                className="bg-[rgb(var(--primary))] text-white rounded-xl font-medium h-10 px-5 transition-smooth hover:bg-[rgb(var(--primary-600))]"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add Your First Site
                            </Button>
                        </div>
                    )}

                    {/* Sites Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {sites.map(site => (
                            <Card key={site.id} className="border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-sm hover:shadow-md transition-smooth group">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-base font-semibold text-[rgb(var(--foreground))]">
                                        {site.name}
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-lg text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-muted))]"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-sm text-[rgb(var(--foreground-secondary))] mb-5">
                                        <Globe className="w-4 h-4" />
                                        <span>{site.domain}</span>
                                        <a
                                            href={`https://${site.domain}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-auto text-[rgb(var(--primary))] hover:underline flex items-center gap-1 text-xs font-medium"
                                        >
                                            Visit <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                    <div className="p-4 bg-[rgb(var(--surface-muted))] rounded-xl border border-[rgb(var(--border))] flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-medium text-[rgb(var(--foreground-secondary))] uppercase tracking-wider">Site ID</span>
                                            <span className="text-xs font-medium text-[rgb(var(--foreground))] tabular-nums">{site.id}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-medium text-[rgb(var(--foreground-secondary))] uppercase tracking-wider">API Key</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-medium text-[rgb(var(--foreground))]">••••••••••••</span>
                                                <button className="p-1.5 hover:bg-[rgb(var(--surface))] rounded-lg transition-colors text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--foreground))]">
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
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
