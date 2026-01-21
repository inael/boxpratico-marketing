'use client';

import { useState, useRef, useEffect } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  iconOnly?: boolean;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
  iconOnly = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const padding = 8;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = -tooltipRect.height - padding;
          left = (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.height + padding;
          left = (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = (triggerRect.height - tooltipRect.height) / 2;
          left = -tooltipRect.width - padding;
          break;
        case 'right':
          top = (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.width + padding;
          break;
      }

      // Ajustar se sair da tela
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const absoluteLeft = triggerRect.left + left;
      const absoluteTop = triggerRect.top + top;

      if (absoluteLeft < 10) {
        left = -triggerRect.left + 10;
      } else if (absoluteLeft + tooltipRect.width > viewportWidth - 10) {
        left = viewportWidth - triggerRect.left - tooltipRect.width - 10;
      }

      if (absoluteTop < 10) {
        top = triggerRect.height + padding;
      } else if (absoluteTop + tooltipRect.height > viewportHeight - 10) {
        top = -tooltipRect.height - padding;
      }

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  return (
    <div
      ref={triggerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onTouchStart={() => setIsVisible(!isVisible)}
    >
      {iconOnly ? (
        <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
      ) : (
        children || <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
      )}

      {isVisible && (
        <div
          ref={tooltipRef}
          className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-normal max-w-xs"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
              position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
              position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
              'left-[-4px] top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
}

// Componente de label com tooltip
interface LabelWithTooltipProps {
  label: string;
  tooltip: string;
  required?: boolean;
  htmlFor?: string;
}

export function LabelWithTooltip({ label, tooltip, required, htmlFor }: LabelWithTooltipProps) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
      {label}
      {required && <span className="text-red-500">*</span>}
      <Tooltip content={tooltip} position="top" iconOnly />
    </label>
  );
}
