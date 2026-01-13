"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { ChatList } from "@/components/chat-list";
import { ChatView } from "@/components/chat-view";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileHeader, MobileBottomNav } from "@/components/mobile-nav";
import { MessageSquare, Send } from "lucide-react";
import { getMyOrganization } from "@/lib/organization";
import { getApiUrl } from "@/lib/api-config";
import { sounds } from "@/lib/sounds";
import { getSocket, releaseSocket } from "@/lib/socket";

// Get organization ID from API or localStorage
async function getOrgId(): Promise<string> {
    if (typeof window === 'undefined') return '';
    const org = await getMyOrganization();
    return org?.siteId || '';
}

export default function ChatsPage() {
    const { language } = useLanguage();
    const t = useTranslation(language);
    const { data: session, status } = useSession();
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [chats, setChats] = useState<any[]>([]);
    const [socket, setSocket] = useState<any>(null);
    const [siteId, setSiteId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Use refs for values needed in socket listeners to avoid stale closures
    const chatsRef = useRef<any[]>([]);
    const selectedChatIdRef = useRef<string | null>(null);
    const socketRef = useRef<any>(null);
    const initialFetchedRef = useRef(false);

    // Get organization ID on mount
    useEffect(() => {
        const fetchOrgId = async () => {
            const orgId = await getOrgId();
            setSiteId(orgId);
        };
        fetchOrgId();
    }, []);

    // Sync refs immediately
    useEffect(() => {
        selectedChatIdRef.current = selectedChatId;
    }, [selectedChatId]);

    useEffect(() => {
        chatsRef.current = chats;
    }, [chats]);

    const handleSelectChat = (id: string) => {
        console.log(`[ChatsPage] Selecting chat: ${id}`);
        setSelectedChatId(id);
        selectedChatIdRef.current = id;
        setChats(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));

        // Notify server to mark messages as read
        if (socketRef.current) {
            console.log(`[ChatsPage] Marking chat ${id} as read on server`);
            socketRef.current.emit('admin:mark_read', { chatId: id });
        }
    };

    // Separate effect for fetching chats with search
    useEffect(() => {
        if (!session?.user || !siteId) return;

        const apiUrl = getApiUrl();

        const queryParams = new URLSearchParams();
        if (debouncedSearchQuery) {
            queryParams.append('search', debouncedSearchQuery);
        }

        console.log(`[ChatsPage] Fetching chats with search: "${debouncedSearchQuery}"`);

        fetch(`${apiUrl}/chats/site/${siteId}?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${(session as any).accessToken}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setChats(prev => {
                        // Map API data to internal format
                        return data.map((c: any) => {
                            const existing = prev.find(p => p.id === c.id);
                            return {
                                id: c.id,
                                visitorId: c.visitorId,
                                visitor: c.visitorName || (c.visitorId ? `Visitor ${c.visitorId.slice(-4)}` : 'Visitor'),
                                lastMsg: c.messages?.[0]?.text || (c.messages?.[0]?.attachment ? t.chatList.fileAttached : t.chatList.noMessages),
                                time: c.messages?.[0] ? new Date(c.messages[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
                                createdAt: c.createdAt,
                                // Use unreadCount from API, but reset to 0 if this chat is currently selected
                                unreadCount: selectedChatIdRef.current === c.id ? 0 : (c.unreadCount || 0),
                                status: existing?.status || 'offline'
                            };
                        });
                    });
                }
            })
            .catch(err => console.error("[ChatsPage] Fetch error:", err));
    }, [session, siteId, debouncedSearchQuery]);

    useEffect(() => {
        if (!session?.user || !siteId) return;

        // Use shared socket manager
        const s = getSocket({ siteId });
        socketRef.current = s;
        setSocket(s);

        const updateChatsWithNewMessage = (msg: any) => {
            console.log("[ChatsPage] Updating chat list with message:", msg);

            // Play sound for new messages from visitors (not from admin)
            if (msg.from !== 'admin') {
                sounds.newMessage(msg.chatId);
            }

            setChats(prev => {
                const existingChat = prev.find(c => c.id === msg.chatId);
                const isCurrentlySelected = msg.chatId === selectedChatIdRef.current;

                const chatData = {
                    id: msg.chatId,
                    visitorId: msg.visitorId || existingChat?.visitorId,
                    visitor: msg.visitorName || existingChat?.visitor || (msg.visitorId ? `Visitor ${msg.visitorId.slice(-4)}` : 'Visitor'),
                    lastMsg: msg.text || (msg.attachment ? t.chatList.fileAttached : t.chatList.noMessages),
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    unreadCount: (existingChat?.unreadCount || 0) + (isCurrentlySelected || msg.from === 'admin' ? 0 : 1),
                    createdAt: existingChat?.createdAt || new Date().toISOString(),
                    status: 'online' // New message means visitor is online
                };

                if (existingChat) {
                    return [chatData, ...prev.filter(c => c.id !== msg.chatId)];
                }
                return [chatData, ...prev];
            });
        };

        s.on("chat:new_message", updateChatsWithNewMessage);
        s.on("chat:message", updateChatsWithNewMessage);

        // Handle visitor going offline
        s.on("visitor:offline", (data: any) => {
            console.log("[ChatsPage] ✅ Received visitor:offline event:", data);
            setChats(prev => {
                const updated = prev.map(chat => {
                    if (chat.id === data.chatId) {
                        console.log(`[ChatsPage] 🔴 Setting chat ${chat.id} status to offline`);
                        return { ...chat, status: 'offline' as const };
                    }
                    return chat;
                });
                console.log("[ChatsPage] Updated chats:", updated.map(c => ({ id: c.id, status: c.status })));
                return updated;
            });
        });

        // Handle unread count updates from server (when messages are marked as read)
        s.on("unread_count_update", (totalUnreadCount: number) => {
            console.log(`[ChatsPage] Received unread_count_update: ${totalUnreadCount}`);
        });

        return () => {
            console.log("[ChatsPage] Releasing socket");
            s.off("chat:new_message", updateChatsWithNewMessage);
            s.off("chat:message", updateChatsWithNewMessage);
            s.off("visitor:offline");
            s.off("unread_count_update");
            releaseSocket();
            socketRef.current = null;
        };
    }, [session, siteId]);

    // Loading State
    if (status === "loading") return (
        <div className="h-screen w-full flex items-center justify-center bg-[rgb(var(--surface-muted))]">
            <div className="flex flex-col items-center gap-4 animate-fade-in">
                <div className="w-10 h-10 border-3 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm font-medium text-[rgb(var(--foreground-secondary))]">Loading your workspace...</div>
            </div>
        </div>
    );

    // Unauthenticated State
    if (status === "unauthenticated") return (
        <div className="h-screen w-full flex items-center justify-center bg-[rgb(var(--surface-muted))]">
            <div className="p-8 bg-[rgb(var(--surface))] rounded-2xl border border-[rgb(var(--border))] text-center max-w-sm animate-fade-in">
                <div className="w-14 h-14 bg-[rgb(var(--accent))] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-6 h-6 text-[rgb(var(--primary))]" />
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2">Welcome to Chtq</h3>
                <p className="text-[rgb(var(--foreground-secondary))] text-sm mb-6">Sign in to access your chat dashboard and start connecting with visitors.</p>
                <a
                    href="/login"
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[rgb(var(--primary))] px-6 text-sm font-medium text-white transition-smooth hover:bg-[rgb(var(--primary-600))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/50"
                >
                    Sign In
                </a>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-full flex flex-col md:flex-row bg-[rgb(var(--surface))] overflow-hidden selection:bg-[rgb(var(--primary))]/20">
            {/* Desktop Sidebar - hidden on mobile */}
            <SidebarNav />

            {/* Mobile Header - visible only on mobile */}
            <MobileHeader />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row min-w-0 h-full overflow-hidden">
                {/* Chat List Panel - full width on mobile when no chat selected, fixed width on desktop */}
                <div className={`
                    ${selectedChatId ? 'hidden md:flex' : 'flex'} 
                    w-full md:w-[340px] 
                    border-r-0 md:border-r border-[rgb(var(--border))] 
                    bg-[rgb(var(--surface))] 
                    flex-col shrink-0 
                    h-full
                    overflow-hidden
                `}>
                    <ChatList
                        onSelect={handleSelectChat}
                        selectedId={selectedChatId}
                        chats={chats}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />
                </div>

                {/* Chat View Area - full screen on mobile when chat selected, always visible on desktop */}
                <div className={`
                    ${selectedChatId ? 'flex' : 'hidden md:flex'} 
                    flex-1 flex-col
                    bg-[rgb(var(--surface-muted))] 
                    h-full 
                    overflow-hidden
                `}>
                    {(() => {
                        const selectedChat = selectedChatId ? chats.find(c => c.id === selectedChatId) : null;

                        // If a chat was selected but is now filtered out, deselect it
                        if (selectedChatId && !selectedChat) {
                            setTimeout(() => setSelectedChatId(null), 0);
                        }

                        return selectedChat ? (
                            <ChatView
                                chat={selectedChat}
                                socket={socket}
                                siteId={siteId}
                                searchQuery={searchQuery}
                                onBack={() => setSelectedChatId(null)}
                                onClearMessages={(id) => {
                                    setChats(prev => prev.map(c => c.id === id ? { ...c, lastMsg: "No messages", time: "" } : c));
                                }}
                                onDeleteChat={(id) => {
                                    setChats(prev => prev.filter(c => c.id !== id));
                                    setSelectedChatId(null);
                                }}
                                onRenameVisitor={(id, newName) => {
                                    setChats(prev => prev.map(c => c.id === id ? { ...c, visitor: newName } : c));
                                }}
                            />
                        ) : null;
                    })()}
                    {/* Empty State - only on desktop when no chat selected */}
                    {!selectedChatId && (
                        <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-8 bg-[rgb(var(--surface))]">
                            <div className="mb-6 relative">
                                <div className="w-20 h-20 bg-[rgb(var(--accent))] rounded-3xl flex items-center justify-center relative z-10 animate-float">
                                    <Send className="w-8 h-8 text-[rgb(var(--primary))]" />
                                </div>
                                <div className="absolute -inset-8 bg-[rgb(var(--accent))] rounded-full blur-3xl opacity-40 -z-0"></div>
                            </div>
                            <h2 className="text-xl font-semibold text-[rgb(var(--foreground))] mb-2">{t.common.selectConversation}</h2>
                            <p className="text-sm text-[rgb(var(--foreground-secondary))] max-w-[280px] leading-relaxed mx-auto">
                                {t.common.chooseChat}
                            </p>
                            <div className="mt-8 px-4 py-2.5 rounded-xl bg-[rgb(var(--surface-muted))] border border-[rgb(var(--border))] text-xs font-medium text-[rgb(var(--foreground-secondary))] flex items-center gap-2">
                                <kbd className="px-1.5 py-0.5 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded text-[10px]">⌘</kbd>
                                <kbd className="px-1.5 py-0.5 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded text-[10px]">K</kbd>
                                <span>{t.common.quickSearch}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Bottom Navigation - visible only on mobile */}
            <MobileBottomNav />
        </div>
    );
}
