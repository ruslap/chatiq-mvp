"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    MessageSquare,
    Globe,
    BarChart3,
    Settings,
    Menu,
    Cloud,
    Laptop,
    HelpCircle,
    LogOut,
    X,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";
import io from "socket.io-client";
import { getMyOrganization } from "@/lib/organization";

interface MobileNavProps {
    unreadCount?: number;
}

// Mobile Header with hamburger menu
export function MobileHeader({ unreadCount = 0 }: MobileNavProps) {
    const { data: session } = useSession();
    const { language } = useLanguage();
    const t = useTranslation(language);
    const [isLocal, setIsLocal] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setIsLocal(localStorage.getItem('chtq_api_url') === 'http://localhost:3000');
    }, []);

    const toggleServer = () => {
        const nextLocal = !isLocal;
        if (nextLocal) {
            localStorage.setItem('chtq_api_url', 'http://localhost:3000');
        } else {
            localStorage.removeItem('chtq_api_url');
        }
        window.location.reload();
    };

    return (
        <div className="h-14 px-4 bg-[rgb(var(--primary-600))] flex items-center justify-between shrink-0 safe-area-top md:hidden">
            {/* Logo & Brand */}
            <Link href="/chats" className="flex items-center gap-3 group active:opacity-80 transition-opacity">
                <div className="w-9 h-9 bg-[#312E81] rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                    <div className="w-6 h-6 bg-white rounded-[7px] flex items-center justify-center">
                        <span className="text-[#312E81] font-bold text-[7px]">Chtq</span>
                    </div>
                </div>
                <span className="text-white font-semibold text-sm">Dashboard</span>
            </Link>

            {/* Hamburger Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-smooth"
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-[rgb(var(--surface))] p-0">
                    <SheetHeader className="p-4 border-b border-[rgb(var(--border))]">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border-2 border-[rgb(var(--primary))]/20">
                                <AvatarFallback className="bg-[rgb(var(--primary))] text-white text-sm font-semibold">
                                    {session?.user?.name?.[0] || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <SheetTitle className="text-sm font-semibold text-[rgb(var(--foreground))] truncate">
                                    {session?.user?.name || 'User'}
                                </SheetTitle>
                                <p className="text-xs text-[rgb(var(--foreground-secondary))] truncate">
                                    {session?.user?.email || ''}
                                </p>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex flex-col p-2">
                        {/* Server Toggle */}
                        <button
                            onClick={toggleServer}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-smooth",
                                isLocal
                                    ? "bg-amber-500/10 text-amber-600"
                                    : "text-[rgb(var(--foreground-secondary))] hover:bg-[rgb(var(--surface-muted))]"
                            )}
                        >
                            {isLocal ? <Laptop className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
                            <div className="flex-1">
                                <span className="text-sm font-medium">Server</span>
                                <p className="text-xs text-[rgb(var(--foreground-secondary))]">
                                    {isLocal ? "Localhost (3000)" : "Cloud (Production)"}
                                </p>
                            </div>
                        </button>

                        {/* Help */}
                        <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-[rgb(var(--foreground-secondary))] hover:bg-[rgb(var(--surface-muted))] transition-smooth">
                            <HelpCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Help & Support</span>
                        </button>

                        {/* Language Switcher */}
                        <div className="flex items-center gap-3 px-4 py-3">
                            <span className="text-sm font-medium text-[rgb(var(--foreground-secondary))]">
                                {language === 'uk' ? 'Мова' : 'Language'}
                            </span>
                            <div className="ml-auto">
                                <LanguageSwitcher />
                            </div>
                        </div>

                        <div className="h-px bg-[rgb(var(--border))] my-2" />

                        {/* Sign Out */}
                        <button
                            onClick={() => {
                                localStorage.removeItem('chtq_org_id');
                                signOut();
                            }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-smooth"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-medium">Sign Out</span>
                        </button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

// Mobile Bottom Navigation
export function MobileBottomNav({ unreadCount = 0 }: MobileNavProps) {
    const pathname = usePathname();
    const { language } = useLanguage();
    const t = useTranslation(language);
    const { data: session } = useSession();
    const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount);
    const [siteId, setSiteId] = useState<string>('');

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

        // Listen for unread count updates
        socket.on('unread_count_update', (count: number) => {
            setLocalUnreadCount(count);
        });

        // Fetch initial unread count
        socket.emit('admin:get_unread_count', { siteId });

        return () => {
            socket.disconnect();
        };
    }, [session, siteId]);

    const navItems = [
        { icon: MessageSquare, label: t.nav.chats, href: "/chats", hasUnread: true },
        { icon: Globe, label: t.nav.sites, href: "/sites", hasUnread: false },
        { icon: BarChart3, label: t.nav.analytics, href: "/analytics", hasUnread: false },
        { icon: Settings, label: t.nav.settings, href: "/settings", hasUnread: false },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden h-16 bg-[rgb(var(--surface))] border-t border-[rgb(var(--border))] flex items-center justify-around px-2 safe-area-bottom shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
            {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const showBadge = item.hasUnread && localUnreadCount > 0;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-xl transition-smooth touch-target",
                            isActive
                                ? "text-[rgb(var(--primary))]"
                                : "text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--foreground))]"
                        )}
                    >
                        <div className="relative">
                            <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                            {showBadge && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border-2 border-[rgb(var(--surface))]">
                                    {localUnreadCount > 99 ? '99+' : localUnreadCount}
                                </div>
                            )}
                        </div>
                        <span className={cn(
                            "text-[10px] mt-1 font-medium",
                            isActive && "font-semibold"
                        )}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
