"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Check,
    Copy,
    Loader2,
    Palette,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { AutomationSettings } from "@/components/automation-settings";
import { TemplatesSettings } from "@/components/templates-settings";
import { BusinessHoursSettings } from "@/components/business-hours-settings";

// Generate a unique UUID
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Get or create organization ID
function getOrCreateOrgId(): string {
    if (typeof window === 'undefined') return '';

    // Use fixed ID for development
    const DEV_ORG_ID = '8df94c53-1364-4bbd-99a4-f9a0ffb01f9a';
    
    // In development, always use the fixed ID
    if (process.env.NODE_ENV === 'development') {
        return DEV_ORG_ID;
    }

    // In production, use localStorage logic
    const storageKey = 'chtq_org_id';
    let orgId = localStorage.getItem(storageKey);

    if (!orgId) {
        orgId = generateUUID();
        localStorage.setItem(storageKey, orgId);
    }

    return orgId;
}

const TABS = [
    { id: 'company', label: 'Компанія' },
    { id: 'channels', label: 'Канали зв\'язку' },
    { id: 'widget', label: 'Віджет' },
    { id: 'hours', label: 'Робочі години' },
    { id: 'automation', label: 'Автоматизація' },
    { id: 'templates', label: 'Шаблони' },
    { id: 'notifications', label: 'Сповіщення' },
];

const WIDGET_COLORS = [
    { id: 'indigo', value: '#6366F1', label: 'Індиго' },
    { id: 'blue', value: '#3B82F6', label: 'Синій' },
    { id: 'emerald', value: '#10B981', label: 'Смарагдовий' },
    { id: 'rose', value: '#F43F5E', label: 'Рожевий' },
    { id: 'amber', value: '#F59E0B', label: 'Бурштин' },
    { id: 'violet', value: '#8B5CF6', label: 'Фіолетовий' },
];

const WIDGET_SIZES = [
    { id: 'standard', label: 'Стандартний' },
    { id: 'compact', label: 'Компактний' },
];

const WIDGET_POSITIONS = [
    { id: 'left', label: 'Ліворуч' },
    { id: 'right', label: 'Праворуч' },
    { id: 'custom', label: 'Задати вручну' },
];

const LANGUAGES = [
    { id: 'uk', label: 'Українська' },
    { id: 'en', label: 'Англійська' },
    { id: 'de', label: 'Німецька' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState('widget');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [copied, setCopied] = useState(false);
    const [orgId, setOrgId] = useState('');

    // Widget settings state
    const [widgetColor, setWidgetColor] = useState('indigo');
    const [widgetSize, setWidgetSize] = useState('standard');
    const [widgetPosition, setWidgetPosition] = useState('right');
    const [selectedLanguages, setSelectedLanguages] = useState(['uk']);
    const [showWelcome, setShowWelcome] = useState(true);
    const [showContactForm, setShowContactForm] = useState(false);
    const [welcomeMessage, setWelcomeMessage] = useState('Вітаю! 👋 Чим можу допомогти?');
    const [operatorName, setOperatorName] = useState('Support Team');
    const [operatorAvatar, setOperatorAvatar] = useState('');

    // Initialize org ID and load settings from API
    useEffect(() => {
        const id = getOrCreateOrgId();
        setOrgId(id);

        // Load settings from API
        const loadSettings = async () => {
            try {
                const res = await fetch(`${API_URL}/widget-settings/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${(session as any).accessToken || 'dummy'}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    // Find color id from hex value
                    const colorMatch = WIDGET_COLORS.find(c => c.value === data.color);
                    if (colorMatch) setWidgetColor(colorMatch.id);
                    else if (data.color) setWidgetColor(data.color);


                    setWidgetSize(data.size || 'standard');
                    setWidgetPosition(data.position || 'right');
                    setSelectedLanguages([data.language || 'uk']);
                    setShowWelcome(data.showWelcome ?? true);
                    setShowContactForm(data.showContactForm ?? false);
                    setWelcomeMessage(data.welcomeMessage || 'Вітаю! 👋 Чим можу допомогти?');
                    setOperatorName(data.operatorName || 'Support Team');
                    if (data.operatorAvatar) setOperatorAvatar(data.operatorAvatar);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session) {
            loadSettings();
        }
    }, [session]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Use custom hex if color ID is 'custom', otherwise find hex from presets
            let colorValue = widgetColor;
            if (!widgetColor.startsWith('#')) {
                const colorMatch = WIDGET_COLORS.find(c => c.id === widgetColor);
                colorValue = colorMatch ? colorMatch.value : '#6366F1';
            }

            const response = await fetch(`${API_URL}/widget-settings/${orgId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(session as any).accessToken || 'dummy'}`
                },
                body: JSON.stringify({
                    color: colorValue,
                    secondaryColor: '#B6FF00',
                    operatorName,
                    operatorAvatar,
                    welcomeMessage,
                    showWelcome,
                    position: widgetPosition,
                    size: widgetSize,
                    language: selectedLanguages[0] || 'uk',
                    showContactForm,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to save settings: ${response.status} ${response.statusText}`);
            }

            setSaveSuccess(true);
            setSaveError('');
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            setSaveError(error instanceof Error ? error.message : 'Failed to save settings');
            setTimeout(() => setSaveError(''), 5000);
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to find color ID or set hex
    const setCustomColor = (hex: string) => {
        setWidgetColor(hex);
    };


    const handleCopyCode = async () => {
        const code = getEmbedCode();
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleLanguage = (langId: string) => {
        setSelectedLanguages(prev =>
            prev.includes(langId)
                ? prev.filter(l => l !== langId)
                : [...prev, langId]
        );
    };

    const getEmbedCode = () => {
        const colorValue = WIDGET_COLORS.find(c => c.id === widgetColor)?.value || '#6366F1';
        return `<script async src="https://widget-cdn-chatiq.vercel.app/widget.js"></script>
<script>
  window.chtq = {
    organizationId: "${orgId}",
    language: "${selectedLanguages[0] || 'uk'}",
    color: "${colorValue}",
    position: "${widgetPosition}",
    size: "${widgetSize}"
  }
</script>`;
    };

    if (status === "loading") return (
        <div className="h-screen w-full flex items-center justify-center bg-[rgb(var(--surface-muted))]">
            <div className="flex flex-col items-center gap-4 animate-fade-in">
                <div className="w-10 h-10 border-3 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm font-medium text-[rgb(var(--foreground-secondary))]">Завантаження...</div>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-full flex bg-[rgb(var(--surface))] overflow-hidden selection:bg-[rgb(var(--primary))]/20">
            <SidebarNav />

            <div className="flex-1 overflow-y-auto bg-[rgb(var(--surface-muted))] scrollbar-thin">
                <div className="max-w-[1100px] mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8">
                    {/* Page Title */}
                    <h1 className="text-2xl md:text-3xl font-light text-[rgb(var(--foreground-secondary))] mb-6">
                        Налаштування
                    </h1>

                    {/* Tabs Navigation */}
                    <div className="border-b border-[rgb(var(--border))] mb-6 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto scrollbar-hide">
                        <nav className="flex gap-6 min-w-max">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative pb-3 text-sm font-medium transition-smooth whitespace-nowrap ${activeTab === tab.id
                                        ? 'text-[rgb(var(--primary))]'
                                        : 'text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--foreground))]'
                                        }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(var(--primary))] rounded-full" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Widget Settings Content */}
                    {activeTab === 'widget' && (
                        <div className="space-y-5 animate-fade-in">
                            {/* Widget Settings Card */}
                            <div className="bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-6">
                                    Налаштування віджета
                                </h2>

                                <div className="space-y-5">
                                    {/* Primary Color Picker */}
                                    <div className="grid md:grid-cols-[220px_1fr] gap-3 md:gap-4 items-start">
                                        <label className="text-sm text-[rgb(var(--foreground-secondary))]">
                                            Основний колір:
                                        </label>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            {WIDGET_COLORS.map(color => (
                                                <button
                                                    key={color.id}
                                                    onClick={() => setWidgetColor(color.id)}
                                                    className={`w-9 h-6 rounded-lg border-2 transition-smooth ${widgetColor === color.id || (widgetColor.startsWith('#') && WIDGET_COLORS.find(c => c.value === widgetColor)?.id === color.id)
                                                        ? 'border-[rgb(var(--primary))] ring-2 ring-[rgb(var(--primary))]/20'
                                                        : 'border-[rgb(var(--border))] hover:border-[rgb(var(--foreground-secondary))]'
                                                        }`}
                                                    style={{ backgroundColor: color.value }}
                                                    title={color.label}
                                                />
                                            ))}
                                            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-[rgb(var(--border))]">
                                                <div
                                                    className="w-8 h-8 rounded-full border border-[rgb(var(--border))] overflow-hidden relative"
                                                    style={{ backgroundColor: widgetColor.startsWith('#') ? widgetColor : (WIDGET_COLORS.find(c => c.id === widgetColor)?.value || '#6366F1') }}
                                                >
                                                    <input
                                                        type="color"
                                                        value={widgetColor.startsWith('#') ? widgetColor : (WIDGET_COLORS.find(c => c.id === widgetColor)?.value || '#6366F1')}
                                                        onChange={(e) => setCustomColor(e.target.value)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer scale-150"
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={widgetColor.startsWith('#') ? widgetColor : (WIDGET_COLORS.find(c => c.id === widgetColor)?.value || '')}
                                                    onChange={(e) => setCustomColor(e.target.value)}
                                                    placeholder="#HEX"
                                                    className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] focus:outline-none focus:border-[rgb(var(--primary))]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                {/* Operator Name */}
                                <div className="grid md:grid-cols-[220px_1fr] gap-3 md:gap-4 items-start">
                                    <label className="text-sm text-[rgb(var(--foreground-secondary))]">
                                        Ім'я оператора:
                                    </label>
                                    <input
                                        type="text"
                                        value={operatorName}
                                        onChange={(e) => setOperatorName(e.target.value)}
                                        placeholder="Support Team"
                                        className="px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] text-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none transition-smooth w-full max-w-md"
                                    />
                                </div>

                                {/* Admin Avatar */}
                                <div className="grid md:grid-cols-[220px_1fr] gap-3 md:gap-4 items-start">
                                    <label className="text-sm text-[rgb(var(--foreground-secondary))]">
                                        Аватар оператора:
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-[rgb(var(--surface-muted))] border-2 border-[rgb(var(--border))] overflow-hidden flex items-center justify-center">
                                            {operatorAvatar ? (
                                                <img src={operatorAvatar} alt="Admin Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-[rgb(var(--foreground-secondary))] text-2xl">👤</div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setOperatorAvatar(reader.result as string);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="hidden"
                                                id="avatar-upload"
                                            />
                                            <label
                                                htmlFor="avatar-upload"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-[rgb(var(--primary))] text-white rounded-xl cursor-pointer hover:bg-[rgb(var(--primary-600))] transition-smooth text-sm font-medium"
                                            >
                                                Завантажити фото
                                            </label>
                                            {operatorAvatar && (
                                                <button
                                                    onClick={() => setOperatorAvatar('')}
                                                    className="ml-3 px-4 py-2 text-sm text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--destructive))] transition-smooth"
                                                >
                                                    Видалити
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Widget Position */}
                                <div className="grid md:grid-cols-[220px_1fr] gap-3 md:gap-4 items-start">
                                    <label className="text-sm text-[rgb(var(--foreground-secondary))]">
                                        Позиція віджета:
                                    </label>
                                    <div className="flex flex-wrap p-1 bg-[rgb(var(--surface-muted))] rounded-full w-fit">
                                        {WIDGET_POSITIONS.map(pos => (
                                            <button
                                                key={pos.id}
                                                onClick={() => setWidgetPosition(pos.id)}
                                                className={`px-4 py-2 text-sm font-medium rounded-full transition-smooth ${widgetPosition === pos.id
                                                    ? 'bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] shadow-sm'
                                                    : 'text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--foreground))]'
                                                    }`}
                                            >
                                                {pos.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Languages */}
                                <div className="grid md:grid-cols-[220px_1fr] gap-3 md:gap-4 items-start">
                                    <label className="text-sm text-[rgb(var(--foreground-secondary))]">
                                        Мова віджета:
                                    </label>
                                    <div className="flex flex-wrap gap-4">
                                        {LANGUAGES.map(lang => (
                                            <label
                                                key={lang.id}
                                                className="flex items-center gap-2 cursor-pointer group"
                                            >
                                                <div
                                                    onClick={() => toggleLanguage(lang.id)}
                                                    className={`w-5 h-5 rounded flex items-center justify-center transition-smooth border ${selectedLanguages.includes(lang.id)
                                                        ? 'bg-[rgb(var(--primary))] border-[rgb(var(--primary))]'
                                                        : 'bg-[rgb(var(--surface))] border-[rgb(var(--border))] group-hover:border-[rgb(var(--primary))]/50'
                                                        }`}
                                                >
                                                    {selectedLanguages.includes(lang.id) && (
                                                        <Check className="w-3.5 h-3.5 text-white" />
                                                    )}
                                                </div>
                                                <span className="text-sm text-[rgb(var(--foreground))] group-hover:text-[rgb(var(--primary))] transition-colors">
                                                    {lang.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Show Welcome Toggle */}
                                <div className="grid md:grid-cols-[220px_1fr] gap-3 md:gap-4 items-center">
                                    <label className="text-sm text-[rgb(var(--foreground-secondary))]">
                                        Показувати welcome message:
                                    </label>
                                    <button
                                        onClick={() => setShowWelcome(!showWelcome)}
                                        className={`relative w-12 h-7 rounded-full transition-smooth ${showWelcome
                                            ? 'bg-[rgb(var(--primary))]'
                                            : 'bg-[rgb(var(--border))]'
                                            }`}
                                    >
                                        <div
                                            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-smooth ${showWelcome ? 'left-6' : 'left-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Welcome Message */}
                                {showWelcome && (
                                    <div className="grid md:grid-cols-[220px_1fr] gap-3 md:gap-4 items-start animate-fade-in">
                                        <label className="text-sm text-[rgb(var(--foreground-secondary))]">
                                            Повідомлення:
                                        </label>
                                        <Textarea
                                            value={welcomeMessage}
                                            onChange={(e) => setWelcomeMessage(e.target.value)}
                                            placeholder="Вітальне повідомлення..."
                                            className="min-h-[120px] rounded-xl border-[rgb(var(--border))] bg-[rgb(var(--surface))] focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 resize-none"
                                        />
                                    </div>
                                )}

                                {/* Show Contact Form Toggle */}
                                <div className="grid md:grid-cols-[220px_1fr] gap-3 md:gap-4 items-center">
                                    <label className="text-sm text-[rgb(var(--foreground-secondary))]">
                                        Показувати контактну форму:
                                    </label>
                                    <button
                                        onClick={() => setShowContactForm(!showContactForm)}
                                        className={`relative w-12 h-7 rounded-full transition-smooth ${showContactForm
                                            ? 'bg-[rgb(var(--primary))]'
                                            : 'bg-[rgb(var(--border))]'
                                            }`}
                                    >
                                        <div
                                            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-smooth ${showContactForm ? 'left-6' : 'left-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                                </div>

                                {/* Save Button */}
                                <div className="mt-8 pt-6 border-t border-[rgb(var(--border))] flex items-center gap-3">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="bg-[rgb(var(--primary))] text-white hover:bg-[rgb(var(--primary-600))] h-10 px-6 rounded-xl font-medium transition-smooth disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Збереження...
                                            </>
                                        ) : (
                                            'Зберегти'
                                        )}
                                    </Button>
                                    {saveSuccess && (
                                        <span className="flex items-center gap-1.5 text-sm text-[rgb(var(--success))] animate-fade-in">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Збережено
                                        </span>
                                    )}
                                    {saveError && (
                                        <span className="flex items-center gap-1.5 text-sm text-[rgb(var(--destructive))] animate-fade-in">
                                            <XCircle className="w-4 h-4" />
                                            {saveError}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Install Snippet Card */}
                            <div className="bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-1">
                                    Встановіть віджет на сайт
                                </h2>
                                <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-5">
                                    Скопіюйте код та встановіть його в HTML код вашого сайту
                                </p>

                                {/* Organization ID Display */}
                                <div className="mb-4 p-3 bg-[rgb(var(--accent))] rounded-lg flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-medium text-[rgb(var(--foreground-secondary))] uppercase tracking-wider">
                                            Organization ID
                                        </span>
                                        <p className="text-sm font-mono text-[rgb(var(--primary))]">
                                            {orgId || 'Завантаження...'}
                                        </p>
                                    </div>
                                </div>

                                {/* Code Block */}
                                <div className="relative bg-[rgb(var(--surface-muted))] rounded-xl border border-[rgb(var(--border))] overflow-hidden">
                                    <div className="absolute top-3 right-3 z-10">
                                        <button
                                            onClick={handleCopyCode}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-smooth ${copied
                                                ? 'bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]'
                                                : 'bg-[rgb(var(--surface))] text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--foreground))] border border-[rgb(var(--border))]'
                                                }`}
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5" />
                                                    Скопійовано
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3.5 h-3.5" />
                                                    Скопіювати
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <pre className="p-4 pr-28 overflow-x-auto text-sm font-mono leading-relaxed">
                                        <code>
                                            <span className="text-[#9CA3AF]">&lt;</span>
                                            <span className="text-[#8B5CF6]">script</span>
                                            <span className="text-[#9CA3AF]"> </span>
                                            <span className="text-[#F59E0B]">async</span>
                                            <span className="text-[#9CA3AF]"> src=</span>
                                            <span className="text-[#22C55E]">"https://widget-cdn-chatiq.vercel.app/widget.js"</span>
                                            <span className="text-[#9CA3AF]">&gt;&lt;/</span>
                                            <span className="text-[#8B5CF6]">script</span>
                                            <span className="text-[#9CA3AF]">&gt;</span>
                                            {'\n'}
                                            <span className="text-[#9CA3AF]">&lt;</span>
                                            <span className="text-[#8B5CF6]">script</span>
                                            <span className="text-[#9CA3AF]">&gt;</span>
                                            {'\n'}
                                            <span className="text-[#9CA3AF]">  window.</span>
                                            <span className="text-[rgb(var(--foreground))]">chtq</span>
                                            <span className="text-[#9CA3AF]"> = {'{'}</span>
                                            {'\n'}
                                            <span className="text-[#9CA3AF]">    organizationId: </span>
                                            <span className="text-[#22C55E]">"{orgId || '...'}"</span>
                                            <span className="text-[#9CA3AF]">,</span>
                                            {'\n'}
                                            <span className="text-[#9CA3AF]">    language: </span>
                                            <span className="text-[#22C55E]">"{selectedLanguages[0] || 'uk'}"</span>
                                            <span className="text-[#9CA3AF]">,</span>
                                            {'\n'}
                                            <span className="text-[#9CA3AF]">    color: </span>
                                            <span className="text-[#22C55E]">"{WIDGET_COLORS.find(c => c.id === widgetColor)?.value}"</span>
                                            <span className="text-[#9CA3AF]">,</span>
                                            {'\n'}
                                            <span className="text-[#9CA3AF]">    position: </span>
                                            <span className="text-[#22C55E]">"{widgetPosition}"</span>
                                            <span className="text-[#9CA3AF]">,</span>
                                            {'\n'}
                                            <span className="text-[#9CA3AF]">    size: </span>
                                            <span className="text-[#22C55E]">"{widgetSize}"</span>
                                            {'\n'}
                                            <span className="text-[#9CA3AF]">  {'}'}</span>
                                            {'\n'}
                                            <span className="text-[#9CA3AF]">&lt;/</span>
                                            <span className="text-[#8B5CF6]">script</span>
                                            <span className="text-[#9CA3AF]">&gt;</span>
                                        </code>
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Automation Tab */}
                    {activeTab === 'automation' && (
                        <div className="bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] shadow-sm p-6 animate-fade-in">
                            <AutomationSettings 
                                siteId={orgId} 
                                accessToken={(session as any)?.accessToken || 'dummy'} 
                            />
                        </div>
                    )}

                    {/* Templates Tab */}
                    {activeTab === 'templates' && (
                        <div className="bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] shadow-sm p-6 animate-fade-in">
                            <TemplatesSettings 
                                siteId={orgId} 
                                accessToken={(session as any)?.accessToken || 'dummy'} 
                            />
                        </div>
                    )}

                    {/* Business Hours Tab */}
                    {activeTab === 'hours' && (
                        <div className="bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] shadow-sm p-6 animate-fade-in">
                            <BusinessHoursSettings 
                                siteId={orgId} 
                                accessToken={(session as any)?.accessToken || 'dummy'} 
                            />
                        </div>
                    )}

                    {/* Other tabs placeholder */}
                    {!['widget', 'automation', 'templates', 'hours'].includes(activeTab) && (
                        <div className="bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] shadow-sm p-12 text-center animate-fade-in">
                            <div className="w-16 h-16 bg-[rgb(var(--accent))] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Palette className="w-7 h-7 text-[rgb(var(--primary))]" />
                            </div>
                            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2">
                                {TABS.find(t => t.id === activeTab)?.label}
                            </h2>
                            <p className="text-sm text-[rgb(var(--foreground-secondary))]">
                                Ця секція буде доступна найближчим часом
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
