"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    Loader2,
    Zap,
    Clock,
    MessageSquare,
    Moon,
    ChevronDown,
    ChevronUp,
    GripVertical
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { getApiUrl } from "@/lib/api-config";

interface AutoReply {
    id: string;
    name: string;
    trigger: string;
    message: string;
    delay: number;
    isActive: boolean;
    order: number;
}

const TRIGGERS = [
    { id: 'first_message', label: 'Перше повідомлення', icon: MessageSquare, description: 'Коли відвідувач надсилає перше повідомлення' },
    { id: 'no_reply_5min', label: 'Без відповіді 5 хв', icon: Clock, description: 'Якщо оператор не відповів протягом 5 хвилин' },
    { id: 'no_reply_10min', label: 'Без відповіді 10 хв', icon: Clock, description: 'Якщо оператор не відповів протягом 10 хвилин' },
    { id: 'offline', label: 'Офлайн режим', icon: Moon, description: 'Коли всі оператори офлайн' },
];

interface AutomationSettingsProps {
    siteId: string;
    accessToken: string;
}

export function AutomationSettings({ siteId, accessToken }: AutomationSettingsProps) {
    const { showToast } = useToast();
    const API_URL = getApiUrl();
    const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSeeding, setIsSeeding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const hasInitializedRef = useRef(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formTrigger, setFormTrigger] = useState('first_message');
    const [formMessage, setFormMessage] = useState('');
    const [formDelay, setFormDelay] = useState(0);

    useEffect(() => {
        loadAutoReplies();
    }, [siteId]);

    const loadAutoReplies = async () => {
        try {
            const res = await fetch(`${API_URL}/automation/auto-replies/${siteId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAutoReplies(data);

                // Auto-seed if empty and first load
                if (data.length === 0 && !hasInitializedRef.current) {
                    hasInitializedRef.current = true;
                    await autoSeedDefaults();
                    return; // autoSeedDefaults will set isLoading to false
                }
            }
        } catch (error) {
            console.error('Failed to load auto-replies:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const autoSeedDefaults = async () => {
        setIsSeeding(true);
        try {
            const res = await fetch(`${API_URL}/automation/seed/${siteId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (res.ok) {
                // Reload after seeding
                const reloadRes = await fetch(`${API_URL}/automation/auto-replies/${siteId}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (reloadRes.ok) {
                    const data = await reloadRes.json();
                    setAutoReplies(data);
                }
                showToast('✨ Створено початкові автовідповіді', 'success');
            }
        } catch (error) {
            console.error('Failed to seed defaults:', error);
        } finally {
            setIsSeeding(false);
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formName.trim() || !formMessage.trim()) return;

        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/automation/auto-replies/${siteId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    name: formName,
                    trigger: formTrigger,
                    message: formMessage,
                    delay: formDelay,
                    isActive: true
                })
            });

            if (res.ok) {
                const newReply = await res.json();
                setAutoReplies([...autoReplies, newReply]);
                resetForm();
                setIsCreating(false);
            }
        } catch (error) {
            console.error('Failed to create auto-reply:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (id: string) => {
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/automation/auto-replies/${siteId}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    name: formName,
                    trigger: formTrigger,
                    message: formMessage,
                    delay: formDelay
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setAutoReplies(autoReplies.map(r => r.id === id ? updated : r));
                resetForm();
                setEditingId(null);
            }
        } catch (error) {
            console.error('Failed to update auto-reply:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Видалити це автоматичне повідомлення?')) return;

        try {
            const res = await fetch(`${API_URL}/automation/auto-replies/${siteId}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (res.ok) {
                setAutoReplies(autoReplies.filter(r => r.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete auto-reply:', error);
        }
    };

    const handleCreateDefaults = async () => {
        try {
            const res = await fetch(`${API_URL}/automation/seed/${siteId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (res.ok) {
                loadAutoReplies(); // Reload the list
            }
        } catch (error) {
            console.error('Failed to create default auto-replies:', error);
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            const res = await fetch(`${API_URL}/automation/auto-replies/${siteId}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ isActive: !isActive })
            });

            if (res.ok) {
                setAutoReplies(autoReplies.map(r => r.id === id ? { ...r, isActive: !isActive } : r));
            }
        } catch (error) {
            console.error('Failed to toggle auto-reply:', error);
        }
    };

    const startEditing = (reply: AutoReply) => {
        setEditingId(reply.id);
        setFormName(reply.name);
        setFormTrigger(reply.trigger);
        setFormMessage(reply.message);
        setFormDelay(reply.delay);
        setIsCreating(false);
    };

    const resetForm = () => {
        setFormName('');
        setFormTrigger('first_message');
        setFormMessage('');
        setFormDelay(0);
    };

    const seedDefaults = async () => {
        setIsLoading(true);
        try {
            await fetch(`${API_URL}/automation/seed/${siteId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            await loadAutoReplies();
        } catch (error) {
            console.error('Failed to seed defaults:', error);
        }
    };

    if (isLoading || isSeeding) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--primary))]" />
                <p className="text-sm text-[rgb(var(--foreground-secondary))]">
                    {isSeeding ? 'Створюємо початкові налаштування...' : 'Завантаження...'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
                        Автоматичні відповіді
                    </h2>
                    <p className="text-sm text-[rgb(var(--foreground-secondary))] mt-1">
                        Налаштуйте автоматичні повідомлення для різних ситуацій
                    </p>
                </div>
                <div className="flex gap-2">
                    {autoReplies.length === 0 && (
                        <Button
                            onClick={handleCreateDefaults}
                            variant="outline"
                            className="text-sm"
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            Додати стандартні
                        </Button>
                    )}
                    <Button
                        onClick={() => {
                            setIsCreating(true);
                            setEditingId(null);
                            resetForm();
                        }}
                        className="bg-[rgb(var(--primary))] text-white hover:bg-[rgb(var(--primary-600))]"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Додати
                    </Button>
                </div>
            </div>

            {/* Create/Edit Form */}
            {(isCreating || editingId) && (
                <div className="bg-[rgb(var(--surface-muted))] rounded-xl border border-[rgb(var(--border))] p-5 animate-fade-in">
                    <h3 className="font-medium text-[rgb(var(--foreground))] mb-4">
                        {editingId ? 'Редагувати' : 'Нове автоповідомлення'}
                    </h3>

                    <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-[rgb(var(--foreground-secondary))] mb-1.5 block">
                                    Назва
                                </label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Наприклад: Привітання"
                                    className="w-full px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-[rgb(var(--foreground-secondary))] mb-1.5 block">
                                    Тригер
                                </label>
                                <select
                                    value={formTrigger}
                                    onChange={(e) => setFormTrigger(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none"
                                >
                                    {TRIGGERS.map(t => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-[rgb(var(--foreground-secondary))] mb-1.5 block">
                                Повідомлення
                            </label>
                            <Textarea
                                value={formMessage}
                                onChange={(e) => setFormMessage(e.target.value)}
                                placeholder="Текст автоматичного повідомлення..."
                                className="min-h-[100px] rounded-xl border-[rgb(var(--border))] bg-[rgb(var(--surface))] resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                                    disabled={isSaving || !formName.trim() || !formMessage.trim()}
                                    className="bg-[rgb(var(--primary))] text-white hover:bg-[rgb(var(--primary-600))]"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4 mr-2" />
                                    )}
                                    {editingId ? 'Зберегти' : 'Створити'}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsCreating(false);
                                        setEditingId(null);
                                        resetForm();
                                    }}
                                    variant="ghost"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Скасувати
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Auto-replies List */}
            <div className="space-y-3">
                {autoReplies.length === 0 && !isCreating ? (
                    <div className="text-center py-12 bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))]">
                        <div className="w-14 h-14 bg-[rgb(var(--accent))] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-6 h-6 text-[rgb(var(--primary))]" />
                        </div>
                        <h3 className="font-medium text-[rgb(var(--foreground))] mb-1">
                            Немає автоматичних відповідей
                        </h3>
                        <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-4">
                            Додайте автовідповіді для покращення комунікації з клієнтами
                        </p>
                    </div>
                ) : (
                    autoReplies.map((reply) => {
                        const trigger = TRIGGERS.find(t => t.id === reply.trigger);
                        const TriggerIcon = trigger?.icon || MessageSquare;

                        return (
                            <div
                                key={reply.id}
                                className={`bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] p-4 transition-all ${!reply.isActive ? 'opacity-60' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3 md:gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${reply.isActive
                                        ? 'bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]'
                                        : 'bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))]'
                                        }`}>
                                        <TriggerIcon className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-medium text-[rgb(var(--foreground))] truncate">
                                                    {reply.name}
                                                </h4>
                                                <span className="hidden md:inline-block text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))] mt-1">
                                                    {trigger?.label}
                                                </span>
                                            </div>

                                            {/* Actions - aligned right */}
                                            <div className="flex items-center gap-1 md:gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleToggleActive(reply.id, reply.isActive)}
                                                    className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${reply.isActive ? 'bg-[rgb(var(--primary))]' : 'bg-[rgb(var(--border))]'
                                                        }`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${reply.isActive ? 'left-5' : 'left-1'
                                                        }`} />
                                                </button>
                                                <button
                                                    onClick={() => startEditing(reply)}
                                                    className="p-2 hover:bg-[rgb(var(--surface-muted))] rounded-lg text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--primary))] transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(reply.id)}
                                                    className="p-2 hover:bg-[rgb(var(--surface-muted))] rounded-lg text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--destructive))] transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-[rgb(var(--foreground-secondary))] line-clamp-2 mt-1">
                                            {reply.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
