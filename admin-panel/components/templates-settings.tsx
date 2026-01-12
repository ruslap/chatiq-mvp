"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    Loader2,
    FileText,
    Zap,
    Hash
} from "lucide-react";

interface QuickTemplate {
    id: string;
    title: string;
    shortcut: string | null;
    message: string;
    category: string | null;
    isActive: boolean;
    order: number;
}

const CATEGORIES = [
    { id: 'general', label: 'Загальні' },
    { id: 'contacts', label: 'Контакти' },
    { id: 'info', label: 'Інформація' },
    { id: 'sales', label: 'Продажі' },
    { id: 'support', label: 'Підтримка' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface TemplatesSettingsProps {
    siteId: string;
    accessToken: string;
}

export function TemplatesSettings({ siteId, accessToken }: TemplatesSettingsProps) {
    const [templates, setTemplates] = useState<QuickTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string | null>(null);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formShortcut, setFormShortcut] = useState('');
    const [formMessage, setFormMessage] = useState('');
    const [formCategory, setFormCategory] = useState('general');

    useEffect(() => {
        loadTemplates();
    }, [siteId]);

    const loadTemplates = async () => {
        try {
            const res = await fetch(`${API_URL}/automation/templates/${siteId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formTitle.trim() || !formMessage.trim()) return;

        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/automation/templates/${siteId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    title: formTitle,
                    shortcut: formShortcut || null,
                    message: formMessage,
                    category: formCategory,
                    isActive: true
                })
            });

            if (res.ok) {
                const newTemplate = await res.json();
                setTemplates([...templates, newTemplate]);
                resetForm();
                setIsCreating(false);
            }
        } catch (error) {
            console.error('Failed to create template:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (id: string) => {
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/automation/templates/${siteId}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    title: formTitle,
                    shortcut: formShortcut || null,
                    message: formMessage,
                    category: formCategory
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setTemplates(templates.map(t => t.id === id ? updated : t));
                resetForm();
                setEditingId(null);
            }
        } catch (error) {
            console.error('Failed to update template:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Видалити цей шаблон?')) return;

        try {
            const res = await fetch(`${API_URL}/automation/templates/${siteId}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (res.ok) {
                setTemplates(templates.filter(t => t.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete template:', error);
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            const res = await fetch(`${API_URL}/automation/templates/${siteId}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ isActive: !isActive })
            });

            if (res.ok) {
                setTemplates(templates.map(t => t.id === id ? { ...t, isActive: !isActive } : t));
            }
        } catch (error) {
            console.error('Failed to toggle template:', error);
        }
    };

    const startEditing = (template: QuickTemplate) => {
        setEditingId(template.id);
        setFormTitle(template.title);
        setFormShortcut(template.shortcut || '');
        setFormMessage(template.message);
        setFormCategory(template.category || 'general');
        setIsCreating(false);
    };

    const resetForm = () => {
        setFormTitle('');
        setFormShortcut('');
        setFormMessage('');
        setFormCategory('general');
    };

    const seedDefaults = async () => {
        setIsLoading(true);
        try {
            await fetch(`${API_URL}/automation/seed/${siteId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            await loadTemplates();
        } catch (error) {
            console.error('Failed to seed defaults:', error);
        }
    };

    const filteredTemplates = filterCategory
        ? templates.filter(t => t.category === filterCategory)
        : templates;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--primary))]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
                        Шаблони швидких відповідей
                    </h2>
                    <p className="text-sm text-[rgb(var(--foreground-secondary))] mt-1">
                        Готові відповіді для швидкого використання в чаті
                    </p>
                </div>
                <div className="flex gap-2">
                    {templates.length === 0 && (
                        <Button
                            onClick={seedDefaults}
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

            {/* Category Filter */}
            {templates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilterCategory(null)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            !filterCategory
                                ? 'bg-[rgb(var(--primary))] text-white'
                                : 'bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))] hover:bg-[rgb(var(--border))]'
                        }`}
                    >
                        Всі
                    </button>
                    {CATEGORIES.map(cat => {
                        const count = templates.filter(t => t.category === cat.id).length;
                        if (count === 0) return null;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setFilterCategory(cat.id)}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    filterCategory === cat.id
                                        ? 'bg-[rgb(var(--primary))] text-white'
                                        : 'bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))] hover:bg-[rgb(var(--border))]'
                                }`}
                            >
                                {cat.label} ({count})
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Form */}
            {(isCreating || editingId) && (
                <div className="bg-[rgb(var(--surface-muted))] rounded-xl border border-[rgb(var(--border))] p-5 animate-fade-in">
                    <h3 className="font-medium text-[rgb(var(--foreground))] mb-4">
                        {editingId ? 'Редагувати шаблон' : 'Новий шаблон'}
                    </h3>

                    <div className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm text-[rgb(var(--foreground-secondary))] mb-1.5 block">
                                    Назва
                                </label>
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="Наприклад: Привітання"
                                    className="w-full px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-[rgb(var(--foreground-secondary))] mb-1.5 block">
                                    Швидка команда
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--foreground-secondary))]">/</span>
                                    <input
                                        type="text"
                                        value={formShortcut.replace('/', '')}
                                        onChange={(e) => setFormShortcut('/' + e.target.value.replace('/', ''))}
                                        placeholder="hello"
                                        className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-[rgb(var(--foreground-secondary))] mb-1.5 block">
                                    Категорія
                                </label>
                                <select
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-[rgb(var(--foreground-secondary))] mb-1.5 block">
                                Текст повідомлення
                            </label>
                            <Textarea
                                value={formMessage}
                                onChange={(e) => setFormMessage(e.target.value)}
                                placeholder="Текст шаблону..."
                                className="min-h-[100px] rounded-xl border-[rgb(var(--border))] bg-[rgb(var(--surface))] resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                                    disabled={isSaving || !formTitle.trim() || !formMessage.trim()}
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

            {/* Templates List */}
            <div className="grid gap-3 md:grid-cols-2">
                {filteredTemplates.length === 0 && !isCreating ? (
                    <div className="md:col-span-2 text-center py-12 bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))]">
                        <div className="w-14 h-14 bg-[rgb(var(--accent))] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-6 h-6 text-[rgb(var(--primary))]" />
                        </div>
                        <h3 className="font-medium text-[rgb(var(--foreground))] mb-1">
                            {filterCategory ? 'Немає шаблонів у цій категорії' : 'Немає шаблонів'}
                        </h3>
                        <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-4">
                            Додайте шаблони для швидких відповідей у чаті
                        </p>
                    </div>
                ) : (
                    filteredTemplates.map((template) => (
                        <div
                            key={template.id}
                            className={`bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] p-4 transition-all hover:shadow-sm ${
                                !template.isActive ? 'opacity-60' : ''
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-[rgb(var(--foreground))]">
                                        {template.title}
                                    </h4>
                                    {template.shortcut && (
                                        <code className="text-xs px-1.5 py-0.5 rounded bg-[rgb(var(--surface-muted))] text-[rgb(var(--primary))] font-mono">
                                            {template.shortcut}
                                        </code>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => handleToggleActive(template.id, template.isActive)}
                                        className={`relative w-9 h-5 rounded-full transition-colors ${
                                            template.isActive ? 'bg-[rgb(var(--primary))]' : 'bg-[rgb(var(--border))]'
                                        }`}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                                            template.isActive ? 'left-4' : 'left-0.5'
                                        }`} />
                                    </button>
                                    <button
                                        onClick={() => startEditing(template)}
                                        className="p-1.5 hover:bg-[rgb(var(--surface-muted))] rounded-lg text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--primary))] transition-colors"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-1.5 hover:bg-[rgb(var(--surface-muted))] rounded-lg text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--destructive))] transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-[rgb(var(--foreground-secondary))] line-clamp-2 mb-2">
                                {template.message}
                            </p>

                            {template.category && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))]">
                                    {CATEGORIES.find(c => c.id === template.category)?.label || template.category}
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Usage Hint */}
            {templates.length > 0 && (
                <div className="bg-[rgb(var(--accent))] rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 bg-[rgb(var(--primary))]/10 rounded-lg flex items-center justify-center shrink-0">
                        <Hash className="w-4 h-4 text-[rgb(var(--primary))]" />
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-[rgb(var(--foreground))] mb-1">
                            Як використовувати
                        </h4>
                        <p className="text-sm text-[rgb(var(--foreground-secondary))]">
                            У чаті введіть <code className="px-1 py-0.5 bg-[rgb(var(--surface))] rounded text-[rgb(var(--primary))]">/</code> щоб побачити список шаблонів, 
                            або введіть команду напряму (наприклад <code className="px-1 py-0.5 bg-[rgb(var(--surface))] rounded text-[rgb(var(--primary))]">/hello</code>)
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
