"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2,
    Clock,
    Check,
    X,
    Sun,
    Moon,
    CheckCircle2,
    XCircle
} from "lucide-react";

interface DaySchedule {
    start: string;
    end: string;
    isOpen: boolean;
}

interface BusinessHours {
    id: string;
    siteId: string;
    timezone: string;
    isEnabled: boolean;
    offlineMessage: string;
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

const DAYS = [
    { key: 'monday', label: 'Понеділок', labelEn: 'Monday' },
    { key: 'tuesday', label: 'Вівторок', labelEn: 'Tuesday' },
    { key: 'wednesday', label: 'Середа', labelEn: 'Wednesday' },
    { key: 'thursday', label: 'Четвер', labelEn: 'Thursday' },
    { key: 'friday', label: "П'ятниця", labelEn: 'Friday' },
    { key: 'saturday', label: 'Субота', labelEn: 'Saturday' },
    { key: 'sunday', label: 'Неділя', labelEn: 'Sunday' },
];

const TIMEZONES = [
    { id: 'Europe/Kyiv', label: 'Київ (UTC+2/+3)' },
    { id: 'Europe/Warsaw', label: 'Варшава (UTC+1/+2)' },
    { id: 'Europe/London', label: 'Лондон (UTC+0/+1)' },
    { id: 'Europe/Berlin', label: 'Берлін (UTC+1/+2)' },
    { id: 'America/New_York', label: 'Нью-Йорк (UTC-5/-4)' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface BusinessHoursSettingsProps {
    siteId: string;
    accessToken: string;
    language?: 'uk' | 'en';
}

const parseSchedule = (schedule: any): DaySchedule => {
    if (typeof schedule === 'string') {
        try {
            return JSON.parse(schedule);
        } catch {
            return { start: '09:00', end: '18:00', isOpen: true };
        }
    }
    return schedule || { start: '09:00', end: '18:00', isOpen: true };
};

export function BusinessHoursSettings({ siteId, accessToken, language = 'uk' }: BusinessHoursSettingsProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');

    const [isEnabled, setIsEnabled] = useState(true);
    const [timezone, setTimezone] = useState('Europe/Kyiv');
    const [offlineMessage, setOfflineMessage] = useState('');
    const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({
        monday: { start: '09:00', end: '18:00', isOpen: true },
        tuesday: { start: '09:00', end: '18:00', isOpen: true },
        wednesday: { start: '09:00', end: '18:00', isOpen: true },
        thursday: { start: '09:00', end: '18:00', isOpen: true },
        friday: { start: '09:00', end: '18:00', isOpen: true },
        saturday: { start: '10:00', end: '15:00', isOpen: false },
        sunday: { start: '10:00', end: '15:00', isOpen: false },
    });

    useEffect(() => {
        loadBusinessHours();
    }, [siteId]);

    const loadBusinessHours = async () => {
        try {
            const res = await fetch(`${API_URL}/automation/business-hours/${siteId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setIsEnabled(data.isEnabled);
                setTimezone(data.timezone);
                setOfflineMessage(data.offlineMessage);
                setSchedule({
                    monday: parseSchedule(data.monday),
                    tuesday: parseSchedule(data.tuesday),
                    wednesday: parseSchedule(data.wednesday),
                    thursday: parseSchedule(data.thursday),
                    friday: parseSchedule(data.friday),
                    saturday: parseSchedule(data.saturday),
                    sunday: parseSchedule(data.sunday),
                });
            }
        } catch (error) {
            console.error('Failed to load business hours:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError('');
        try {
            const res = await fetch(`${API_URL}/automation/business-hours/${siteId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    isEnabled,
                    timezone,
                    offlineMessage,
                    ...schedule,
                })
            });

            if (res.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Failed to save business hours:', error);
            setSaveError(language === 'uk' ? 'Помилка збереження' : 'Failed to save');
            setTimeout(() => setSaveError(''), 5000);
        } finally {
            setIsSaving(false);
        }
    };

    const updateDaySchedule = (day: string, field: keyof DaySchedule, value: any) => {
        setSchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    const applyToWeekdays = () => {
        const mondaySchedule = schedule.monday;
        setSchedule(prev => ({
            ...prev,
            tuesday: { ...mondaySchedule },
            wednesday: { ...mondaySchedule },
            thursday: { ...mondaySchedule },
            friday: { ...mondaySchedule },
        }));
    };

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
            <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
                    {language === 'uk' ? 'Робочі години' : 'Business Hours'}
                </h2>
                <p className="text-sm text-[rgb(var(--foreground-secondary))] mt-1">
                    {language === 'uk'
                        ? 'Налаштуйте години роботи для автоматичних повідомлень у неробочий час'
                        : 'Set working hours for automatic offline messages'}
                </p>
            </div>

            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-[rgb(var(--surface-muted))] rounded-xl">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEnabled ? 'bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]' : 'bg-[rgb(var(--surface))] text-[rgb(var(--foreground-secondary))]'
                        }`}>
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-medium text-[rgb(var(--foreground))]">
                            {language === 'uk' ? 'Увімкнути робочі години' : 'Enable business hours'}
                        </h3>
                        <p className="text-sm text-[rgb(var(--foreground-secondary))]">
                            {language === 'uk'
                                ? 'Автоматичні повідомлення в неробочий час'
                                : 'Auto-reply when outside business hours'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsEnabled(!isEnabled)}
                    className={`relative w-12 h-7 rounded-full transition-colors ${isEnabled ? 'bg-[rgb(var(--primary))]' : 'bg-[rgb(var(--border))]'
                        }`}
                >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${isEnabled ? 'left-6' : 'left-1'
                        }`} />
                </button>
            </div>

            {/* Company Open/Closed Toggle */}
            {(() => {
                const allClosed = DAYS.every(day => !schedule[day.key]?.isOpen);
                return (
                    <div className={`flex items-center justify-between p-4 rounded-xl border ${allClosed
                            ? 'bg-[rgb(var(--destructive))]/5 border-[rgb(var(--destructive))]/20'
                            : 'bg-[rgb(var(--success))]/5 border-[rgb(var(--success))]/20'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${allClosed
                                    ? 'bg-[rgb(var(--destructive))]/10 text-[rgb(var(--destructive))]'
                                    : 'bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]'
                                }`}>
                                {allClosed ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="font-medium text-[rgb(var(--foreground))]">
                                    {allClosed
                                        ? (language === 'uk' ? 'Компанія не працює' : 'Company closed')
                                        : (language === 'uk' ? 'Компанія працює' : 'Company open')
                                    }
                                </h3>
                                <p className="text-sm text-[rgb(var(--foreground-secondary))]">
                                    {allClosed
                                        ? (language === 'uk' ? 'Всі дні закриті (відпустка, свята)' : 'All days closed (vacation, holidays)')
                                        : (language === 'uk' ? 'Чат працює за розкладом' : 'Chat works according to schedule')
                                    }
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (allClosed) {
                                    // Open all days with default hours
                                    const openSchedule: Record<string, DaySchedule> = {};
                                    DAYS.forEach(day => {
                                        const isWeekend = day.key === 'saturday' || day.key === 'sunday';
                                        openSchedule[day.key] = {
                                            start: '09:00',
                                            end: '18:00',
                                            isOpen: !isWeekend
                                        };
                                    });
                                    setSchedule(openSchedule);
                                } else {
                                    // Close all days
                                    const closedSchedule: Record<string, DaySchedule> = {};
                                    DAYS.forEach(day => {
                                        closedSchedule[day.key] = { ...schedule[day.key], isOpen: false };
                                    });
                                    setSchedule(closedSchedule);
                                }
                                setIsEnabled(true);
                            }}
                            className={allClosed
                                ? 'text-[rgb(var(--success))] border-[rgb(var(--success))]/30 hover:bg-[rgb(var(--success))]/10'
                                : 'text-[rgb(var(--destructive))] border-[rgb(var(--destructive))]/30 hover:bg-[rgb(var(--destructive))]/10'
                            }
                        >
                            {allClosed ? (
                                <>
                                    <Sun className="w-4 h-4 mr-2" />
                                    {language === 'uk' ? 'Відкрити' : 'Open'}
                                </>
                            ) : (
                                <>
                                    <Moon className="w-4 h-4 mr-2" />
                                    {language === 'uk' ? 'Закрити все' : 'Close all'}
                                </>
                            )}
                        </Button>
                    </div>
                );
            })()}

            {isEnabled && (
                <>
                    {/* Timezone */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[rgb(var(--foreground))]">
                            {language === 'uk' ? 'Часовий пояс' : 'Timezone'}
                        </label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none"
                        >
                            {TIMEZONES.map(tz => (
                                <option key={tz.id} value={tz.id}>{tz.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Schedule */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <label className="text-sm font-medium text-[rgb(var(--foreground))]">
                                {language === 'uk' ? 'Розклад' : 'Schedule'}
                            </label>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={applyToWeekdays}
                                    className="text-xs text-[rgb(var(--primary))]"
                                >
                                    {language === 'uk' ? 'Пн → будні' : 'Mon → weekdays'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        // Mark weekends as closed
                                        setSchedule(prev => ({
                                            ...prev,
                                            saturday: { ...prev.saturday, isOpen: false },
                                            sunday: { ...prev.sunday, isOpen: false },
                                        }));
                                    }}
                                    className="text-xs text-[rgb(var(--foreground-secondary))]"
                                >
                                    <Moon className="w-3 h-3 mr-1" />
                                    {language === 'uk' ? 'Вихідні' : 'Weekends off'}
                                </Button>
                            </div>
                        </div>

                        <div className="bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] overflow-hidden">
                            {DAYS.map((day, index) => {
                                const daySchedule = schedule[day.key];
                                const isWeekend = day.key === 'saturday' || day.key === 'sunday';

                                return (
                                    <div
                                        key={day.key}
                                        className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 ${index < DAYS.length - 1 ? 'border-b border-[rgb(var(--border))]' : ''
                                            } ${isWeekend ? 'bg-[rgb(var(--surface-muted))]/50' : ''}`}
                                    >
                                        {/* Day header row */}
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            {/* Day toggle */}
                                            <button
                                                onClick={() => updateDaySchedule(day.key, 'isOpen', !daySchedule.isOpen)}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${daySchedule.isOpen
                                                        ? 'bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]'
                                                        : 'bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground-secondary))]'
                                                    }`}
                                            >
                                                {daySchedule.isOpen ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                            </button>

                                            {/* Day name */}
                                            <span className={`text-sm font-medium sm:w-28 ${daySchedule.isOpen ? 'text-[rgb(var(--foreground))]' : 'text-[rgb(var(--foreground-secondary))]'
                                                }`}>
                                                {language === 'uk' ? day.label : day.labelEn}
                                            </span>

                                            {/* Mobile: closed label */}
                                            {!daySchedule.isOpen && (
                                                <span className="sm:hidden text-xs text-[rgb(var(--foreground-secondary))] italic ml-auto">
                                                    {language === 'uk' ? 'Вихідний' : 'Closed'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Time inputs - stacked on mobile */}
                                        {daySchedule.isOpen ? (
                                            <div className="flex items-center gap-2 pl-11 sm:pl-0 sm:flex-1">
                                                <input
                                                    type="time"
                                                    value={daySchedule.start}
                                                    onChange={(e) => updateDaySchedule(day.key, 'start', e.target.value)}
                                                    className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none"
                                                />
                                                <span className="text-[rgb(var(--foreground-secondary))]">—</span>
                                                <input
                                                    type="time"
                                                    value={daySchedule.end}
                                                    onChange={(e) => updateDaySchedule(day.key, 'end', e.target.value)}
                                                    className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none"
                                                />
                                            </div>
                                        ) : (
                                            <span className="hidden sm:block text-sm text-[rgb(var(--foreground-secondary))] italic flex-1">
                                                {language === 'uk' ? 'Вихідний' : 'Closed'}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Offline Message */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[rgb(var(--foreground))]">
                            {language === 'uk' ? 'Повідомлення в неробочий час' : 'Offline message'}
                        </label>
                        <Textarea
                            value={offlineMessage}
                            onChange={(e) => setOfflineMessage(e.target.value)}
                            placeholder={language === 'uk'
                                ? 'Дякуємо за звернення! Наразі ми не в мережі...'
                                : 'Thank you for reaching out! We are currently offline...'}
                            className="min-h-[120px] rounded-xl border-[rgb(var(--border))] bg-[rgb(var(--surface))] resize-none"
                        />
                        <p className="text-xs text-[rgb(var(--foreground-secondary))]">
                            {language === 'uk'
                                ? 'Це повідомлення буде автоматично надіслано відвідувачам у неробочий час'
                                : 'This message will be automatically sent to visitors outside business hours'}
                        </p>
                    </div>
                </>
            )}

            {/* Save Button */}
            <div className="pt-4 border-t border-[rgb(var(--border))] flex items-center gap-3">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-[rgb(var(--primary))] text-white hover:bg-[rgb(var(--primary-600))] h-10 px-6 rounded-xl font-medium"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {language === 'uk' ? 'Збереження...' : 'Saving...'}
                        </>
                    ) : (
                        language === 'uk' ? 'Зберегти' : 'Save'
                    )}
                </Button>
                {saveSuccess && (
                    <span className="flex items-center gap-1.5 text-sm text-[rgb(var(--success))] animate-fade-in">
                        <CheckCircle2 className="w-4 h-4" />
                        {language === 'uk' ? 'Збережено' : 'Saved'}
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
