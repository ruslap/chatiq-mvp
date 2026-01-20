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
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>

        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-5 peer-focus:ring-2 peer-focus:ring-blue-400"></div>
        </label>
      </div>

      {enabled && children && (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
