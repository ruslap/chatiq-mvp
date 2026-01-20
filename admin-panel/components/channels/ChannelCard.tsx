'use client';

import { ReactNode } from 'react';

interface ChannelCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children?: ReactNode;
}

export function ChannelCard({
  icon,
  title,
  description,
  enabled,
  onToggle,
  children,
}: ChannelCardProps) {
  return (
    <div className="bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] p-4 transition-all hover:shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[rgb(var(--accent))] rounded-xl flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-[rgb(var(--foreground))]">{title}</h3>
            <p className="text-sm text-[rgb(var(--foreground-secondary))]">{description}</p>
          </div>
        </div>

        <button
          onClick={() => onToggle(!enabled)}
          className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-[rgb(var(--primary))]' : 'bg-[rgb(var(--border))]'
            }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${enabled ? 'left-5' : 'left-0.5'
              }`}
          />
        </button>
      </div>

      {children && (
        <div className="mt-4 space-y-4 border-t border-[rgb(var(--border))] pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
