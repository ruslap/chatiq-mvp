import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
            },
            colors: {
                background: 'rgb(var(--background) / <alpha-value>)',
                foreground: 'rgb(var(--foreground) / <alpha-value>)',
                card: {
                    DEFAULT: 'rgb(var(--card) / <alpha-value>)',
                    foreground: 'rgb(var(--card-foreground) / <alpha-value>)'
                },
                popover: {
                    DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
                    foreground: 'rgb(var(--popover-foreground) / <alpha-value>)'
                },
                primary: {
                    DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
                    foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
                    50: 'rgb(var(--primary-50) / <alpha-value>)',
                    100: 'rgb(var(--primary-100) / <alpha-value>)',
                    300: 'rgb(var(--primary-300) / <alpha-value>)',
                    500: 'rgb(var(--primary-500) / <alpha-value>)',
                    600: 'rgb(var(--primary-600) / <alpha-value>)',
                    700: 'rgb(var(--primary-700) / <alpha-value>)',
                },
                secondary: {
                    DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
                    foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
                    200: 'rgb(var(--secondary-200) / <alpha-value>)',
                    400: 'rgb(var(--secondary-400) / <alpha-value>)',
                    600: 'rgb(var(--secondary-600) / <alpha-value>)',
                    800: 'rgb(var(--secondary-800) / <alpha-value>)',
                },
                muted: {
                    DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
                    foreground: 'rgb(var(--muted-foreground) / <alpha-value>)'
                },
                accent: {
                    DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
                    foreground: 'rgb(var(--accent-foreground) / <alpha-value>)'
                },
                destructive: {
                    DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
                    foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)'
                },
                success: 'rgb(var(--success) / <alpha-value>)',
                warning: 'rgb(var(--warning) / <alpha-value>)',
                border: 'rgb(var(--border) / <alpha-value>)',
                input: 'rgb(var(--input) / <alpha-value>)',
                ring: 'rgb(var(--ring) / <alpha-value>)',
                surface: {
                    DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
                    muted: 'rgb(var(--surface-muted) / <alpha-value>)',
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            animation: {
                'fade-in': 'fade-in 0.3s ease-out forwards',
                'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                'fade-in': {
                    from: { opacity: '0', transform: 'translateY(4px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'pulse-soft': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.6' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
            },
        }
    },
    plugins: [tailwindcssAnimate],
};
export default config;
