"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Globe, BarChart3, Settings, Server, Cloud, Laptop, HelpCircle, LogOut } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";
import io from "socket.io-client";
import { getMyOrganization } from "@/lib/organization";

export function SidebarNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isLocal, setIsLocal] = useState(false);
    const { language } = useLanguage();
    const t = useTranslation(language);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState<any>(null);
    const [siteId, setSiteId] = useState<string>('');

    useEffect(() => {
        setIsLocal(localStorage.getItem('chtq_api_url') === 'http://localhost:3000');
    }, []);

    // Get organization ID and set up socket for unread count
    useEffect(() => {
        const fetchOrgId = async () => {
            const orgId = await getMyOrganization();
            setSiteId(orgId);
        };
        fetchOrgId();
    }, []);

    useEffect(() => {
        if (!session?.user || !siteId) return;

        const apiUrl = localStorage.getItem('chtq_api_url')
            || process.env.NEXT_PUBLIC_API_URL
            || "http://localhost:3000";
        const socket = io(apiUrl);

        socket.on('connect', () => {
            socket.emit('admin:join', { siteId });
        });

        // Listen for new messages to update unread count
        const updateUnreadCount = () => {
            socket.emit('admin:get_unread_count', { siteId });
        };

        socket.on('chat:new_message', updateUnreadCount);
        socket.on('unread_count_update', (count: number) => {
            setUnreadCount(count);
        });

        // Fetch initial unread count
        updateUnreadCount();

        return () => {
            socket.disconnect();
        };
    }, [session, siteId]);

    const toggleServer = () => {
        const nextLocal = !isLocal;
        if (nextLocal) {
            localStorage.setItem('chtq_api_url', 'http://localhost:3000');
        } else {
            localStorage.removeItem('chtq_api_url');
        }
        window.location.reload();
    };

    const navItems = [
        { icon: MessageSquare, label: t.nav.chats, href: "/chats" },
        { icon: Globe, label: t.nav.sites, href: "/sites" },
        { icon: BarChart3, label: t.nav.analytics, href: "/analytics" },
        { icon: Settings, label: t.nav.settings, href: "/settings" },
    ];

    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex flex-col h-full w-[72px] bg-[rgb(var(--primary-600))] py-5 items-center gap-2 shrink-0 overflow-hidden relative">
                {/* Brand Logo */}
                <div className="mb-6">
                    <div className="w-11 h-11 bg-white/95 rounded-2xl flex items-center justify-center text-[rgb(var(--primary-600))] font-bold text-sm shadow-lg shadow-black/10 transition-smooth hover:scale-105">
                        Chtq
                    </div>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 flex flex-col gap-1.5 w-full px-2.5">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const hasUnread = item.label === t.nav.chats && unreadCount > 0;
                        return (
                            <Tooltip key={item.label}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={`group relative flex items-center justify-center w-full aspect-square rounded-xl transition-smooth ${isActive
                                            ? 'bg-white/20 text-white shadow-sm'
                                            : 'text-white/60 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 transition-smooth ${isActive ? '' : 'group-hover:scale-105'}`} />
                                        {isActive && (
                                            <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full -ml-2.5" />
                                        )}
                                        {hasUnread && (
                                            <>
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] px-1 flex items-center justify-center border-2 border-[rgb(var(--primary-600))]">
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </div>
                                            </>
                                        )}
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    sideOffset={12}
                                    className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))] text-xs font-medium px-3 py-1.5 shadow-lg"
                                >
                                    <div className="flex items-center gap-2">
                                        {item.label}
                                        {hasUnread && (
                                            <span className="text-red-500 font-bold">
                                                ({unreadCount > 99 ? '99+' : unreadCount})
                                            </span>
                                        )}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </nav>

                {/* Footer Navigation */}
                <div className="mt-auto flex flex-col gap-1 w-full px-2.5">
                    {/* Server Toggle */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={toggleServer}
                                className={`flex items-center justify-center w-full aspect-square rounded-xl transition-smooth ${isLocal
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'text-white/50 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {isLocal ? <Laptop className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={12} className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))] text-xs font-medium px-3 py-1.5">
                            Server: {isLocal ? "Localhost (3000)" : "Cloud (Render)"}
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="flex items-center justify-center w-full aspect-square rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-smooth">
                                <HelpCircle className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={12} className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))] text-xs font-medium px-3 py-1.5">
                            Help
                        </TooltipContent>
                    </Tooltip>

                    <div className="h-px bg-white/10 mx-1 my-2" />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('chtq_org_id');
                                    signOut();
                                }}
                                className="flex items-center justify-center w-full aspect-square rounded-xl text-white/40 hover:text-red-300 hover:bg-red-500/20 transition-smooth"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={12} className="bg-[rgb(var(--surface))] text-red-500 border-red-200 text-xs font-medium px-3 py-1.5">
                            Sign Out
                        </TooltipContent>
                    </Tooltip>

                    <div className="mt-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="w-full flex justify-center">
                                    <Avatar className="w-10 h-10 border-2 border-white/20 cursor-pointer hover:border-white/40 transition-smooth">
                                        <AvatarFallback className="bg-white/90 text-[rgb(var(--primary-600))] text-xs font-semibold">
                                            {session?.user?.name?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={12} className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))] text-xs font-medium px-3 py-1.5">
                                {session?.user?.name || 'Profile'}
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Language Switcher */}
                    <div className="mt-2 group">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <LanguageSwitcher />
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={12} className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))] text-xs font-medium px-3 py-1.5">
                                {language === 'uk' ? 'Language: Українська' : 'Language: English'}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
