"use client";

import { Search, Package } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";

interface Chat {
    id: string;
    visitorId: string;
    visitor: string;
    lastMsg: string;
    time: string;
    unreadCount?: number;
    status?: 'online' | 'offline';
}

interface ChatListProps {
    onSelect: (id: string) => void;
    selectedId: string | null;
    chats: Chat[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export function ChatList({ onSelect, selectedId, chats, searchQuery, onSearchChange }: ChatListProps) {
    const { language } = useLanguage();
    const t = useTranslation(language);

    return (
        <div className="flex flex-col h-full bg-[rgb(var(--surface))] select-none">
            {/* Header */}
            <div className="px-5 py-5 shrink-0 border-b border-[rgb(var(--border))] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-semibold text-[rgb(var(--foreground-secondary))] uppercase tracking-widest">
                                {t.chatList.liveChats}
                            </span>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[rgb(var(--success))]/10 rounded-full border border-[rgb(var(--success))]/20">
                                <div className="w-1.5 h-1.5 bg-[rgb(var(--success))] rounded-full animate-pulse" />
                                <span className="text-[10px] font-semibold text-[rgb(var(--success))] uppercase tracking-wide">{t.common.live}</span>
                            </div>
                        </div>
                        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] tracking-tight">
                            {t.chatList.messages}
                        </h2>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <div className="px-3 py-1.5 bg-gradient-to-br from-[rgb(var(--primary))]/15 to-[rgb(var(--primary-600))]/10 border border-[rgb(var(--primary))]/25 rounded-lg shadow-sm">
                            <span className="text-[11px] font-bold text-[rgb(var(--primary))] uppercase tracking-wider">
                                {t.common.demo}
                            </span>
                        </div>
                        <span className="text-[10px] text-[rgb(var(--foreground-secondary))] font-medium">
                            {chats.length} {language === 'uk' ? (chats.length === 1 ? 'чат' : chats.length < 5 ? 'чати' : 'чатів') : (chats.length === 1 ? 'chat' : 'chats')}
                        </span>
                    </div>
                </div>

                {/* Search Input */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[rgb(var(--foreground-secondary))] group-focus-within:text-[rgb(var(--primary))] transition-colors">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={language === 'uk' ? 'Пошук розмов...' : 'Search conversations...'}
                        className="w-full pl-10 pr-4 py-2.5 bg-[rgb(var(--surface-muted))] border-none rounded-xl text-sm font-normal outline-none transition-smooth placeholder:text-[rgb(var(--foreground-secondary))] focus:bg-[rgb(var(--surface))] focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-1">
                    {[t.chatList.all, t.chatList.new, t.chatList.mine].map((tab, idx) => {
                        const unreadCount = tab === 'New' ? chats.filter(c => (c.unreadCount || 0) > 0).reduce((sum, c) => sum + (c.unreadCount || 0), 0) : 0;
                        return (
                            <button
                                key={tab}
                                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-smooth relative ${idx === 0
                                    ? 'bg-[rgb(var(--primary))] text-white'
                                    : 'text-[rgb(var(--foreground-secondary))] hover:bg-[rgb(var(--surface-muted))]'
                                    }`}
                            >
                                {tab}
                                {idx === 1 && unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] animate-pulse-soft">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[rgb(var(--foreground-secondary))] uppercase tracking-wider">
                        {t.chatList.conversations}
                    </span>
                    <div className="flex items-center gap-2">
                        {chats.filter(c => (c.unreadCount || 0) > 0).length > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-[rgb(var(--primary))]/10 rounded-full">
                                <div className="w-2 h-2 bg-[rgb(var(--primary))] rounded-full animate-pulse" />
                                <span className="text-[10px] font-semibold text-[rgb(var(--primary))]">
                                    {chats.filter(c => (c.unreadCount || 0) > 0).length} {t.chatList.unread}
                                </span>
                            </div>
                        )}
                        <span className="text-[10px] font-medium text-[rgb(var(--foreground-secondary))] tabular-nums">
                            {chats.length} {t.chatList.total}
                        </span>
                    </div>
                </div>

                {/* Empty State */}
                {chats.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
                        <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--surface-muted))] flex items-center justify-center mb-4">
                            <Package className="w-6 h-6 text-[rgb(var(--foreground-secondary))]" />
                        </div>
                        <p className="text-sm font-medium text-[rgb(var(--foreground-secondary))]">
                            {t.chatList.noConversations}
                        </p>
                        <p className="text-xs text-[rgb(var(--foreground-secondary))]/70 mt-1">
                            {t.chatList.waitingForVisitors}
                        </p>
                    </div>
                )}

                {/* Chat Items */}
                <div className="flex flex-col px-2">
                    {chats.map(chat => {
                        const isUnread = (chat.unreadCount || 0) > 0 && selectedId !== chat.id;
                        const isSelected = selectedId === chat.id;

                        return (
                            <div
                                key={chat.id}
                                className={`group relative flex items-center gap-3 px-3 py-3.5 cursor-pointer rounded-xl mx-1 mb-1 transition-smooth ${isSelected
                                    ? 'bg-[rgb(var(--accent))]'
                                    : isUnread
                                        ? 'bg-[rgb(var(--primary-50))]/50'
                                        : 'hover:bg-[rgb(var(--surface-muted))]'
                                    }`}
                                onClick={() => onSelect(chat.id)}
                            >
                                {/* Active Indicator */}
                                {isSelected && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[rgb(var(--primary))] rounded-r-full -ml-1" />
                                )}

                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <Avatar className={`w-11 h-11 border-0 transition-smooth ${isSelected ? 'ring-2 ring-[rgb(var(--primary))]/20' : ''}`}>
                                        <AvatarFallback className={`${isSelected
                                            ? 'bg-[rgb(var(--primary))] text-white'
                                            : 'bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))]'
                                            } font-medium transition-colors text-sm`}>
                                            {chat.visitor[0] || 'V'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[rgb(var(--surface))] rounded-full flex items-center justify-center border border-[rgb(var(--border))]">
                                        <div className={`w-2 h-2 ${isUnread ? 'bg-[rgb(var(--primary))]' :
                                            chat.status === 'offline' ? 'bg-[rgb(var(--foreground-secondary))]' :
                                                'bg-[rgb(var(--success))]'
                                            } rounded-full`}></div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <span className={`text-sm truncate transition-colors ${isSelected
                                            ? 'font-semibold text-[rgb(var(--primary-700))]'
                                            : isUnread
                                                ? 'font-semibold text-[rgb(var(--foreground))]'
                                                : 'font-medium text-[rgb(var(--foreground))]'
                                            }`}>
                                            {chat.visitor}
                                        </span>
                                        <span className={`text-[10px] font-medium tabular-nums transition-colors shrink-0 ml-2 ${isSelected
                                            ? 'text-[rgb(var(--primary))]'
                                            : isUnread
                                                ? 'text-[rgb(var(--primary))]'
                                                : 'text-[rgb(var(--foreground-secondary))]'
                                            }`}>
                                            {chat.time}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-xs truncate leading-relaxed transition-colors ${isSelected
                                            ? 'text-[rgb(var(--primary-600))]'
                                            : isUnread
                                                ? 'text-[rgb(var(--foreground))] font-medium'
                                                : 'text-[rgb(var(--foreground-secondary))]'
                                            }`}>
                                            {chat.lastMsg}
                                        </span>
                                        {isUnread && (
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-[rgb(var(--primary))] rounded-full animate-ping opacity-20" />
                                                <div className="relative bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--primary-600))] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg shadow-[rgb(var(--primary))]/25 min-w-[20px] text-center border border-white/20">
                                                    {chat.unreadCount}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
