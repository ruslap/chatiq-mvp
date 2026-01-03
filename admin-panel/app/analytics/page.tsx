"use client";

import { SidebarNav } from "@/components/sidebar-nav";
import { BarChart3, TrendingUp, Users, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AnalyticsPage() {
    const stats = [
        { label: "Total Chats", value: "1,284", change: "+12.5%", positive: true, icon: BarChart3 },
        { label: "Avg. Response Time", value: "1m 42s", change: "-18%", positive: true, icon: Clock },
        { label: "Active Visitors", value: "48", change: "+24%", positive: true, icon: Users },
        { label: "Conversion Rate", value: "3.2%", change: "+0.4%", positive: true, icon: TrendingUp },
    ];

    return (
        <div className="h-screen w-full flex bg-[rgb(var(--surface))] overflow-hidden selection:bg-[rgb(var(--primary))]/20">
            <SidebarNav />

            <div className="flex-1 overflow-y-auto bg-[rgb(var(--surface-muted))] scrollbar-thin">
                {/* Header */}
                <header className="h-16 border-b border-[rgb(var(--border))] px-8 flex justify-between items-center bg-[rgb(var(--surface))] sticky top-0 z-10">
                    <div>
                        <h1 className="font-semibold text-base text-[rgb(var(--foreground))]">Analytics</h1>
                        <p className="text-xs text-[rgb(var(--foreground-secondary))]">Track your chat performance</p>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    {/* Stats Grid */}
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-8">
                        {stats.map((stat, idx) => (
                            <Card
                                key={stat.label}
                                className="border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-sm hover:shadow-md transition-smooth animate-fade-in"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2.5 bg-[rgb(var(--accent))] rounded-xl">
                                            <stat.icon className="w-5 h-5 text-[rgb(var(--primary))]" />
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${stat.positive
                                                ? 'text-[rgb(var(--success))] bg-[rgb(var(--success))]/10'
                                                : 'text-[rgb(var(--destructive))] bg-[rgb(var(--destructive))]/10'
                                            }`}>
                                            {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {stat.change}
                                        </div>
                                    </div>
                                    <div className="text-2xl font-semibold text-[rgb(var(--foreground))] tabular-nums">{stat.value}</div>
                                    <div className="text-xs font-medium text-[rgb(var(--foreground-secondary))] mt-1">{stat.label}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Charts Placeholder */}
                    <Card className="border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-sm">
                        <CardContent className="p-16 text-center">
                            <div className="max-w-sm mx-auto animate-fade-in">
                                <div className="w-16 h-16 bg-[rgb(var(--accent))] rounded-2xl flex items-center justify-center mx-auto mb-5 animate-float">
                                    <BarChart3 className="w-7 h-7 text-[rgb(var(--primary))]" />
                                </div>
                                <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2">Detailed Reports Coming Soon</h2>
                                <p className="text-sm text-[rgb(var(--foreground-secondary))] leading-relaxed">
                                    We're building advanced analytics and custom reports to help you understand your chat performance better.
                                </p>
                                <div className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-[rgb(var(--primary))]">
                                    <div className="w-2 h-2 bg-[rgb(var(--primary))] rounded-full animate-pulse-soft" />
                                    In Development
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
