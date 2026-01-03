"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { forwardRef, ButtonHTMLAttributes } from "react";

export const LanguageSwitcher = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => {
    const { language, toggleLanguage } = useLanguage();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        toggleLanguage();
        props.onClick?.(e);
    };

    return (
        <button
            ref={ref}
            {...props}
            onClick={handleClick}
            className="flex items-center justify-center w-full aspect-square rounded-xl text-white/40 hover:text-white hover:bg-white/20 transition-smooth"
        >
            {language === 'uk' ? (
                // Ukraine flag
                <svg width="20" height="20" viewBox="0 0 20 20" className="rounded-sm overflow-hidden">
                    <rect width="20" height="10" fill="#005BBB"/>
                    <rect y="10" width="20" height="10" fill="#FFD500"/>
                </svg>
            ) : (
                // US flag (simplified)
                <svg width="20" height="20" viewBox="0 0 20 20" className="rounded-sm overflow-hidden">
                    <rect width="20" height="20" fill="#B22234"/>
                    <rect y="1.5" width="20" height="1.5" fill="white"/>
                    <rect y="5" width="20" height="1.5" fill="white"/>
                    <rect y="8.5" width="20" height="1.5" fill="white"/>
                    <rect y="12" width="20" height="1.5" fill="white"/>
                    <rect y="15.5" width="20" height="1.5" fill="white"/>
                    <rect width="8.5" height="10.5" fill="#3C3B6E"/>
                </svg>
            )}
        </button>
    );
});

LanguageSwitcher.displayName = 'LanguageSwitcher';
