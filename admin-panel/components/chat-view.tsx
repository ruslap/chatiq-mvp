"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Paperclip, Smile, Send, Trash2, Eraser, X, Pencil, Check } from "lucide-react";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";

interface Message {
    id: string;
    chatId: string;
    text: string;
    from: 'admin' | 'visitor';
    createdAt: string;
    attachment?: {
        url: string;
        name: string;
        size: string;
        type: 'image' | 'file';
    };
}

interface QuickTemplate {
    id: string;
    title: string;
    shortcut: string | null;
    message: string;
    category: string | null;
}

interface ChatViewProps {
    chat: {
        id: string;
        visitor: string;
        visitorId: string;
        status?: 'online' | 'offline';
    };
    socket: any;
    siteId: string;
    onDeleteChat?: (id: string) => void;
    onClearMessages?: (id: string) => void;
}

export function ChatView({ chat, socket, siteId, onDeleteChat, onClearMessages }: ChatViewProps) {
    const chatId = chat?.id;
    const { data: session } = useSession();
    const { language } = useLanguage();
    const t = useTranslation(language);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [showConfirm, setShowConfirm] = useState<'clear' | 'delete' | null>(null);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newVisitorName, setNewVisitorName] = useState("");
    const [quickTemplates, setQuickTemplates] = useState<QuickTemplate[]>([]);
    const [showTemplates, setShowTemplates] = useState(false);
    const [templateFilter, setTemplateFilter] = useState("");
    const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const templateListRef = useRef<HTMLDivElement>(null);

    // Configurable API URL for flexibility between local/prod
    const apiUrl = (typeof window !== 'undefined' && localStorage.getItem('chtq_api_url'))
        || "http://localhost:3000";

    // Fetch message history
    useEffect(() => {
        if (chatId) {
            fetch(`${apiUrl}/chats/${chatId}/history`, {
                headers: {
                    'Authorization': `Bearer ${(session as any)?.accessToken || 'dummy'}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        // Parse attachments for each message
                        const messagesWithParsedAttachments = data.map(msg => {
                            if (msg.attachment && typeof msg.attachment === 'string') {
                                try {
                                    msg.attachment = JSON.parse(msg.attachment);
                                } catch (e) {
                                    console.error('Failed to parse attachment:', e);
                                }
                            }
                            return msg;
                        });
                        setMessages(messagesWithParsedAttachments);
                    } else {
                        console.error("Messages fetch did not return an array:", data);
                        setMessages([]);
                    }
                })
                .catch(err => {
                    console.error("History fetch error:", err);
                    setMessages([]);
                });

            // Mark messages as read
            if (socket) {
                socket.emit('admin:mark_read', { chatId });
            }
        }
    }, [chatId, session, apiUrl, socket]);

    // Load quick templates
    useEffect(() => {
        const orgId = typeof window !== 'undefined' ? localStorage.getItem('chtq_org_id') : null;
        if (!orgId) return;

        fetch(`${apiUrl}/automation/templates/${orgId}/active`, {
            headers: { 'Authorization': `Bearer ${(session as any)?.accessToken || 'dummy'}` }
        })
            .then(res => res.ok ? res.json() : [])
            .then(data => setQuickTemplates(Array.isArray(data) ? data : []))
            .catch(() => setQuickTemplates([]));
    }, [session, apiUrl]);

    useEffect(() => {
        if (!socket) return;

        const handleIncomingMessage = (msg: Message) => {
            if (msg.chatId === chatId) {
                // Parse attachment if it's a string
                if (msg.attachment && typeof msg.attachment === 'string') {
                    try {
                        msg.attachment = JSON.parse(msg.attachment);
                    } catch (e) {
                        console.error('Failed to parse attachment:', e);
                    }
                }
                setMessages(prev => {
                    const currentMessages = Array.isArray(prev) ? prev : [];
                    if (currentMessages.find(m => m.id === msg.id)) return currentMessages;
                    return [...currentMessages, msg];
                });
            }
        };

        socket.on("chat:message", handleIncomingMessage);
        socket.on("admin:message", handleIncomingMessage);
        socket.on("chat:new_message", handleIncomingMessage);

        return () => {
            socket.off("chat:message", handleIncomingMessage);
            socket.off("admin:message", handleIncomingMessage);
            socket.off("chat:new_message", handleIncomingMessage);
        };
    }, [chatId, socket]);

    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const handleFileSelect = (file: File) => {
        if (!file) return;

        // Check file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert(t.chatView.fileSizeLimit);
            return;
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        const allowedExtensions = ['.doc', '.docx', '.txt'];
        
        if (!allowedTypes.includes(file.type) && !allowedExtensions.some(ext => file.name.endsWith(ext))) {
            alert(t.chatView.invalidFileType);
            return;
        }

        setAttachedFile(file);
    };

    const clearFileUpload = () => {
        setAttachedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSend = async () => {
        if ((!input.trim() && !attachedFile) || !socket) return;

        let attachment = null;
        
        // Upload file if present
        if (attachedFile) {
            setIsUploading(true);
            try {
                const formData = new FormData();
                formData.append('file', attachedFile);
                formData.append('siteId', siteId);
                
                const response = await fetch(`${apiUrl}/upload`, {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) throw new Error('Upload failed');
                
                attachment = await response.json();
            } catch (error) {
                console.error('Upload error:', error);
                alert(t.chatView.fileUploadFailed);
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        socket.emit("admin:message", {
            chatId,
            text: input,
            siteId: siteId,
            attachment: attachment
        });

        setInput("");
        setAttachedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClear = async () => {
        try {
            const res = await fetch(`${apiUrl}/chats/${chatId}/clear`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${(session as any)?.accessToken || 'dummy'}`
                }
            });
            if (res.ok) {
                setMessages([]);
                onClearMessages?.(chatId);
                setShowConfirm(null);
            } else if (res.status === 404) {
                alert("Error 404: The backend server does not have this feature yet. If you are using Render, please deploy your latest changes. If testing locally, ensure you have set localStorage.setItem('chtq_api_url', 'http://localhost:3000').");
            } else {
                alert(`Failed to clear chat: ${res.statusText}`);
            }
        } catch (err) {
            console.error("Failed to clear chat:", err);
            alert("Network error. Please check if the API server is reachable.");
        }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`${apiUrl}/chats/${chatId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${(session as any)?.accessToken || 'dummy'}`
                }
            });
            if (res.ok) {
                onDeleteChat?.(chatId);
                setShowConfirm(null);
            } else if (res.status === 404) {
                alert("Error 404: The backend server does not have this feature yet. If you are using Render, please deploy your latest changes. If testing locally, ensure you have set localStorage.setItem('chtq_api_url', 'http://localhost:3000').");
            } else {
                alert(`Failed to delete chat: ${res.statusText}`);
            }
        } catch (err) {
            console.error("Failed to delete chat:", err);
            alert("Network error. Please check if the API server is reachable.");
        }
    };

    const handleRename = async () => {
        if (!newVisitorName.trim()) {
            setIsRenaming(false);
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/chats/${chatId}/rename`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(session as any)?.accessToken || 'dummy'}`
                },
                body: JSON.stringify({ visitorName: newVisitorName.trim() })
            });

            if (res.ok) {
                chat.visitor = newVisitorName.trim();
                setIsRenaming(false);
                setNewVisitorName("");
            } else {
                alert(`Failed to rename visitor: ${res.statusText}`);
            }
        } catch (err) {
            console.error("Failed to rename visitor:", err);
            alert("Network error. Please check if the API server is reachable.");
        }
    };

    // Filter templates based on input
    const filteredTemplates = quickTemplates.filter(t => {
        if (!templateFilter) return true;
        const search = templateFilter.toLowerCase().replace('/', '');
        return (
            t.title.toLowerCase().includes(search) ||
            (t.shortcut && t.shortcut.toLowerCase().includes(search)) ||
            t.message.toLowerCase().includes(search)
        );
    });

    // Handle input change with template detection
    const handleInputChange = (value: string) => {
        setInput(value);
        
        // Check if input starts with /
        if (value.startsWith('/') && quickTemplates.length > 0) {
            setShowTemplates(true);
            setTemplateFilter(value);
            setSelectedTemplateIndex(0);
        } else {
            setShowTemplates(false);
            setTemplateFilter("");
        }
    };

    // Select a template
    const selectTemplate = (template: QuickTemplate) => {
        setInput(template.message);
        setShowTemplates(false);
        setTemplateFilter("");
    };

    // Handle keyboard navigation in templates
    const handleTemplateKeyDown = (e: React.KeyboardEvent) => {
        if (!showTemplates || filteredTemplates.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedTemplateIndex(prev => 
                prev < filteredTemplates.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedTemplateIndex(prev => 
                prev > 0 ? prev - 1 : filteredTemplates.length - 1
            );
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            selectTemplate(filteredTemplates[selectedTemplateIndex]);
        } else if (e.key === 'Escape') {
            setShowTemplates(false);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            selectTemplate(filteredTemplates[selectedTemplateIndex]);
        }
    };

    const safeMessages = Array.isArray(messages) ? messages : [];

    return (
        <div className="flex flex-col h-full bg-[rgb(var(--surface-muted))] selection:bg-[rgb(var(--primary))]/20">
            {/* Header */}
            <div className="h-16 px-6 bg-[rgb(var(--surface))] border-b border-[rgb(var(--border))] flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar className="w-10 h-10 border-0 ring-2 ring-[rgb(var(--border))]">
                            <AvatarFallback className="bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))] font-medium text-sm">
                                {chat.visitor?.[0] || 'V'}
                            </AvatarFallback>
                        </Avatar>
                        <div className={`absolute ring-2 ring-[rgb(var(--surface))] -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${chat.status === 'offline' ? 'bg-[rgb(var(--foreground-secondary))]' : 'bg-[rgb(var(--success))]'}`}></div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isRenaming ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newVisitorName}
                                    onChange={(e) => setNewVisitorName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRename();
                                        if (e.key === 'Escape') {
                                            setIsRenaming(false);
                                            setNewVisitorName("");
                                        }
                                    }}
                                    placeholder={t.chatView.enterNewName}
                                    className="px-2 py-1 text-sm font-semibold bg-[rgb(var(--surface-muted))] border border-[rgb(var(--border))] rounded-lg outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
                                    autoFocus
                                />
                                <button
                                    onClick={handleRename}
                                    className="p-1 hover:bg-[rgb(var(--surface-muted))] rounded text-[rgb(var(--success))]"
                                    title={t.chatView.save}
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        setIsRenaming(false);
                                        setNewVisitorName("");
                                    }}
                                    className="p-1 hover:bg-[rgb(var(--surface-muted))] rounded text-[rgb(var(--foreground-secondary))]"
                                    title={t.chatView.cancel}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group">
                                <div>
                                    <div className="font-semibold text-sm text-[rgb(var(--foreground))] leading-none">{chat.visitor}</div>
                                    <div className={`text-[10px] font-medium uppercase tracking-wider mt-1 ${
                                        chat.status === 'offline' 
                                            ? 'text-[rgb(var(--foreground-secondary))]' 
                                            : 'text-[rgb(var(--success))]'
                                    }`}>
                                        {chat.status === 'offline' ? 'Офлайн' : t.chatView.activeNow}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsRenaming(true);
                                        setNewVisitorName(chat.visitor);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[rgb(var(--surface-muted))] rounded text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--primary))] transition-all"
                                    title={t.chatView.renameVisitor}
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfirm('clear')}
                        title={t.chatView.clearHistory}
                        className="h-9 w-9 p-0 rounded-lg hover:bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))] hover:text-amber-500"
                    >
                        <Eraser className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfirm('delete')}
                        title={t.chatView.deleteConversation}
                        className="h-9 w-9 p-0 rounded-lg hover:bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))] hover:text-red-500"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="w-[1px] h-4 bg-[rgb(var(--border))] mx-1"></div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))]"
                    >
                        <Settings className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 px-6 py-6" ref={scrollRef}>
                <div className="flex flex-col gap-4 max-w-2xl mx-auto min-h-full">
                    {safeMessages.map((msg, idx) => {
                        const isPrevFromSame = idx > 0 && safeMessages[idx - 1].from === msg.from;
                        const isAdmin = msg.from === 'admin';

                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} ${isPrevFromSame ? '-mt-2' : ''} animate-fade-in`}
                            >
                                {!isPrevFromSame && (
                                    <div className="mb-1.5 px-1">
                                        {isAdmin ? (
                                            <span className="text-[10px] font-medium text-[rgb(var(--foreground-secondary))] uppercase tracking-wider">{t.common.you}</span>
                                        ) : (
                                            <span className="text-sm font-bold text-[rgb(var(--primary))]">{chat.visitor}</span>
                                        )}
                                    </div>
                                )}
                                <div className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[80%] transition-smooth ${isAdmin
                                    ? 'bg-[rgb(var(--primary))] text-white rounded-br-md'
                                    : 'bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] rounded-bl-md border border-[rgb(var(--border))]'
                                    }`}>
                                    {msg.attachment && (
                                        <div className="mb-2">
                                            {msg.attachment.type === 'image' ? (
                                                <img 
                                                    src={msg.attachment.url} 
                                                    alt={msg.attachment.name}
                                                    className="rounded-lg max-w-sm cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(msg.attachment.url, '_blank')}
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 p-2 bg-[rgb(var(--muted))]/50 rounded-lg">
                                                    <Paperclip className="w-4 h-4" />
                                                    <a 
                                                        href={msg.attachment.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-sm hover:underline"
                                                    >
                                                        {msg.attachment.name}
                                                    </a>
                                                    <span className="text-xs text-[rgb(var(--foreground-secondary))]">
                                                        ({msg.attachment.size})
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {msg.text && <div>{msg.text}</div>}
                                    <div className={`text-[10px] mt-1.5 tabular-nums ${isAdmin ? 'text-white/60 text-right' : 'text-[rgb(var(--foreground-secondary))] text-left'
                                        }`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Empty State */}
                    {safeMessages.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center py-16 animate-fade-in">
                            <div className="w-16 h-16 bg-[rgb(var(--surface))] rounded-2xl border border-[rgb(var(--border))] flex items-center justify-center mb-4 animate-float">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[rgb(var(--foreground-secondary))]">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-[rgb(var(--foreground-secondary))]">{t.chatView.waitingForMessages}</p>
                            <p className="text-xs text-[rgb(var(--foreground-secondary))]/70 mt-1">{t.chatView.visitorHasntSent}</p>
                        </div>
                    )}
                    <div className="h-4 w-full" />
                </div>
            </ScrollArea>

            {/* Composer */}
            <div className="px-6 pb-6 pt-2 shrink-0">
                <div className="max-w-2xl mx-auto">
                    {/* File Preview */}
                    {attachedFile && (
                        <div className="mb-3 p-3 bg-[rgb(var(--surface))] rounded-2xl border border-[rgb(var(--border))] flex items-center gap-3 animate-fade-in">
                            <div className="w-10 h-10 bg-[rgb(var(--primary))]/10 rounded-lg flex items-center justify-center shrink-0">
                                <Paperclip className="w-5 h-5 text-[rgb(var(--primary))]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[rgb(var(--foreground))] truncate">{attachedFile.name}</p>
                                <p className="text-xs text-[rgb(var(--foreground-secondary))]">{(attachedFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFileUpload}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))]"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                    
                    <div className="relative bg-[rgb(var(--surface))] rounded-2xl border border-[rgb(var(--border))] shadow-sm focus-within:border-[rgb(var(--primary))]/30 focus-within:ring-4 focus-within:ring-[rgb(var(--primary))]/5 transition-smooth">
                        {/* Quick Templates Popup */}
                        {showTemplates && filteredTemplates.length > 0 && (
                            <div 
                                ref={templateListRef}
                                className="absolute bottom-full left-0 right-0 mb-2 bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] shadow-lg max-h-64 overflow-y-auto z-50 animate-fade-in"
                            >
                                <div className="p-2 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))]">
                                    <p className="text-xs text-[rgb(var(--foreground-secondary))] px-2">
                                        {language === 'uk' ? 'Швидкі шаблони' : 'Quick templates'} • <kbd className="px-1 py-0.5 bg-[rgb(var(--surface))] rounded text-[10px]">↑↓</kbd> {language === 'uk' ? 'вибрати' : 'select'} • <kbd className="px-1 py-0.5 bg-[rgb(var(--surface))] rounded text-[10px]">Tab</kbd> {language === 'uk' ? 'вставити' : 'insert'}
                                    </p>
                                </div>
                                {filteredTemplates.map((template, index) => (
                                    <button
                                        key={template.id}
                                        onClick={() => selectTemplate(template)}
                                        className={`w-full text-left px-4 py-3 hover:bg-[rgb(var(--surface-muted))] transition-colors border-b border-[rgb(var(--border))] last:border-b-0 ${
                                            index === selectedTemplateIndex ? 'bg-[rgb(var(--primary))]/5' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-sm text-[rgb(var(--foreground))]">
                                                {template.title}
                                            </span>
                                            {template.shortcut && (
                                                <code className="text-xs px-1.5 py-0.5 rounded bg-[rgb(var(--surface-muted))] text-[rgb(var(--primary))] font-mono">
                                                    {template.shortcut}
                                                </code>
                                            )}
                                        </div>
                                        <p className="text-xs text-[rgb(var(--foreground-secondary))] line-clamp-1">
                                            {template.message}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}

                        <Textarea
                            value={input}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder={quickTemplates.length > 0 ? (language === 'uk' ? 'Введіть повідомлення... (/ для шаблонів)' : 'Type message... (/ for templates)') : t.chatView.typeMessage}
                            className="w-full min-h-[52px] max-h-40 p-4 pb-14 bg-transparent border-none focus-visible:ring-0 resize-none text-sm leading-relaxed placeholder:text-[rgb(var(--foreground-secondary))]"
                            onKeyDown={(e) => {
                                if (showTemplates) {
                                    handleTemplateKeyDown(e);
                                    if (['ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) return;
                                }
                                if (e.key === 'Enter' && !e.shiftKey && !showTemplates) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />

                        {/* Bottom Actions */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                            <div className="flex gap-0.5">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                                    className="hidden"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-8 w-8 p-0 rounded-lg text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-muted))]"
                                >
                                    <Paperclip className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-muted))]"
                                >
                                    <Smile className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-[11px] text-[rgb(var(--foreground-secondary))] hidden sm:block">
                                    Press <kbd className="px-1.5 py-0.5 bg-[rgb(var(--surface-muted))] border border-[rgb(var(--border))] rounded text-[10px] font-medium mx-0.5">{t.chatView.pressEnter}</kbd> to send
                                </span>
                                <Button
                                    onClick={handleSend}
                                    disabled={(!input.trim() && !attachedFile) || isUploading}
                                    className="bg-[rgb(var(--primary))] text-white hover:bg-[rgb(var(--primary-600))] h-9 px-4 rounded-xl shrink-0 flex items-center gap-2 font-medium text-xs transition-smooth disabled:opacity-40 disabled:cursor-not-allowed"
                                    title={`${t.chatView.send} (${t.chatView.pressEnter})`}
                                >
                                    <span>{isUploading ? t.chatView.uploading : t.chatView.send}</span>
                                    {isUploading ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Send className="w-3.5 h-3.5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowConfirm(null)}>
                    <div className="bg-[rgb(var(--surface))] rounded-2xl border border-[rgb(var(--border))] p-6 max-w-sm mx-4 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2">
                            {showConfirm === 'clear' ? 'Clear Chat History?' : 'Delete Conversation?'}
                        </h3>
                        <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-6">
                            {showConfirm === 'clear'
                                ? 'All messages in this chat will be permanently deleted.'
                                : 'This conversation will be permanently deleted and cannot be recovered.'}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="ghost"
                                onClick={() => setShowConfirm(null)}
                                className="h-10 px-4 rounded-xl hover:bg-[rgb(var(--surface-muted))]"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={showConfirm === 'clear' ? handleClear : handleDelete}
                                className={`h-10 px-4 rounded-xl text-white ${showConfirm === 'clear' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'}`}
                            >
                                {showConfirm === 'clear' ? 'Clear History' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
