'use client';

import { useState, useEffect } from 'react';
import { Loader2, Mail, Bell, Clock, CheckCircle2, XCircle, Info } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';

interface NotificationsSettingsProps {
    siteId: string;
    accessToken: string;
}

export function NotificationsSettings({ siteId, accessToken }: NotificationsSettingsProps) {
    const API_URL = getApiUrl();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');

    // Fields
    const [notificationEmail, setNotificationEmail] = useState('');
    const [emailFallbackEnabled, setEmailFallbackEnabled] = useState(false);
    const [emailFallbackAddress, setEmailFallbackAddress] = useState('');
    const [emailFallbackTimeout, setEmailFallbackTimeout] = useState(5);

    useEffect(() => {
        if (!siteId || !accessToken) return;
        const load = async () => {
            try {
                const res = await fetch(`${API_URL}/sites/${siteId}/notifications`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setNotificationEmail(data.notificationEmail || '');
                    setEmailFallbackEnabled(data.emailFallbackEnabled ?? false);
                    setEmailFallbackAddress(data.emailFallbackAddress || '');
                    setEmailFallbackTimeout(data.emailFallbackTimeout ?? 5);
                }
            } catch (e) {
                console.error('Failed to load notification settings', e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [siteId, accessToken]);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError('');
        try {
            const res = await fetch(`${API_URL}/sites/${siteId}/notifications`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    notificationEmail: notificationEmail.trim() || null,
                    emailFallbackEnabled,
                    emailFallbackAddress: emailFallbackAddress.trim() || null,
                    emailFallbackTimeout: Number(emailFallbackTimeout),
                }),
            });

            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (e: any) {
            setSaveError(e.message || 'Помилка збереження');
            setTimeout(() => setSaveError(''), 5000);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--primary))]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Сповіщення</h2>
                <p className="text-sm text-[rgb(var(--foreground-secondary))] mt-1">
                    Налаштуйте email-сповіщення про нові чати та повідомлення
                </p>
            </div>

            {/* Section 1: Notification Email */}
            <div className="bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[rgb(var(--primary))]/10 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-[rgb(var(--primary))]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[rgb(var(--foreground))]">Email для сповіщень</h3>
                        <p className="text-xs text-[rgb(var(--foreground-secondary))]">
                            Отримуйте сповіщення про нові чати на цей email
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-[200px_1fr] gap-3 items-center">
                    <label className="text-sm text-[rgb(var(--foreground-secondary))]">
                        Email адреса:
                    </label>
                    <input
                        type="email"
                        value={notificationEmail}
                        onChange={(e) => setNotificationEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))] text-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none transition-all w-full max-w-md"
                    />
                </div>
            </div>

            {/* Section 2: Email Fallback */}
            <div className="bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[rgb(var(--primary))]/10 flex items-center justify-center">
                            <Mail className="w-4 h-4 text-[rgb(var(--primary))]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[rgb(var(--foreground))]">Email-fallback</h3>
                            <p className="text-xs text-[rgb(var(--foreground-secondary))]">
                                Відправити email клієнту, якщо оператор не відповів
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setEmailFallbackEnabled(!emailFallbackEnabled)}
                        className={`relative w-12 h-7 rounded-full transition-all ${emailFallbackEnabled
                            ? 'bg-[rgb(var(--primary))]'
                            : 'bg-[rgb(var(--border))]'
                            }`}
                    >
                        <div
                            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${emailFallbackEnabled ? 'left-6' : 'left-1'
                                }`}
                        />
                    </button>
                </div>

                {emailFallbackEnabled && (
                    <div className="space-y-4 pt-2 border-t border-[rgb(var(--border))] animate-fade-in">
                        {/* Fallback address */}
                        <div className="grid md:grid-cols-[200px_1fr] gap-3 items-center">
                            <label className="text-sm text-[rgb(var(--foreground-secondary))]">
                                Надсилати на:
                            </label>
                            <input
                                type="email"
                                value={emailFallbackAddress}
                                onChange={(e) => setEmailFallbackAddress(e.target.value)}
                                placeholder="support@example.com"
                                className="px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))] text-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none transition-all w-full max-w-md"
                            />
                        </div>

                        {/* Timeout */}
                        <div className="grid md:grid-cols-[200px_1fr] gap-3 items-center">
                            <label className="text-sm text-[rgb(var(--foreground-secondary))] flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                Затримка (хвилини):
                            </label>
                            <div className="flex items-center gap-3 max-w-md">
                                <input
                                    type="range"
                                    min={1}
                                    max={60}
                                    value={emailFallbackTimeout}
                                    onChange={(e) => setEmailFallbackTimeout(Number(e.target.value))}
                                    className="flex-1 accent-[rgb(var(--primary))]"
                                />
                                <span className="text-sm font-semibold text-[rgb(var(--primary))] w-16 text-right">
                                    {emailFallbackTimeout} хв
                                </span>
                            </div>
                        </div>

                        {/* Info hint */}
                        <div className="flex items-start gap-2 p-3 bg-[rgb(var(--accent))] rounded-lg">
                            <Info className="w-4 h-4 text-[rgb(var(--primary))] shrink-0 mt-0.5" />
                            <p className="text-xs text-[rgb(var(--foreground-secondary))]">
                                Якщо оператор не відповів протягом{' '}
                                <strong className="text-[rgb(var(--foreground))]">{emailFallbackTimeout} хвилин</strong>{' '}
                                після першого повідомлення відвідувача, система автоматично надішле
                                сповіщення на вказаний email. Для роботи потрібно налаштувати SMTP у
                                змінних середовища.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[rgb(var(--primary))] text-white rounded-xl text-sm font-medium hover:bg-[rgb(var(--primary-600))] transition-all disabled:opacity-50"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Збереження...
                        </>
                    ) : (
                        'Зберегти'
                    )}
                </button>

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
    );
}
