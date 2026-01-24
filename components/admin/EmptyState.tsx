'use client';

import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, Plus, Search, FileQuestion, Inbox, FolderOpen } from 'lucide-react';

type EmptyStateVariant = 'default' | 'search' | 'filter' | 'error' | 'noData';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  icon?: LucideIcon;
  mascotImage?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  compact?: boolean;
}

const variantConfig: Record<EmptyStateVariant, { icon: LucideIcon; color: string; bgColor: string }> = {
  default: { icon: Inbox, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
  search: { icon: Search, color: 'text-amber-500', bgColor: 'bg-amber-50' },
  filter: { icon: FolderOpen, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  error: { icon: FileQuestion, color: 'text-red-500', bgColor: 'bg-red-50' },
  noData: { icon: Inbox, color: 'text-gray-400', bgColor: 'bg-gray-100' },
};

export default function EmptyState({
  variant = 'default',
  title,
  description,
  icon,
  mascotImage,
  primaryAction,
  secondaryAction,
  children,
  compact = false,
}: EmptyStateProps) {
  const [mascotError, setMascotError] = useState(false);
  const config = variantConfig[variant];
  const IconComponent = icon || config.icon;

  // Mascot images por variante (quando disponíveis)
  const defaultMascotImages: Record<EmptyStateVariant, string> = {
    default: '/images/mascot-empty.png',
    search: '/images/mascot-search.png',
    filter: '/images/mascot-filter.png',
    error: '/images/mascot-error.png',
    noData: '/images/mascot-empty.png',
  };

  const mascotSrc = mascotImage || defaultMascotImages[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-8 px-4' : 'py-16 px-6'
      }`}
    >
      {/* Mascot ou Icon */}
      <div className="mb-6">
        {!mascotError && mascotSrc ? (
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            src={mascotSrc}
            alt="BoxPratico Mascote"
            className={compact ? 'w-24 h-24' : 'w-40 h-40'}
            onError={() => setMascotError(true)}
          />
        ) : (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className={`${compact ? 'w-16 h-16' : 'w-24 h-24'} rounded-full ${config.bgColor} flex items-center justify-center`}
          >
            <IconComponent className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} ${config.color}`} />
          </motion.div>
        )}
      </div>

      {/* Title */}
      <h3 className={`font-semibold text-gray-900 ${compact ? 'text-lg' : 'text-xl'} mb-2`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={`text-gray-500 max-w-md ${compact ? 'text-sm' : 'text-base'} mb-6`}>
          {description}
        </p>
      )}

      {/* Custom Content */}
      {children && <div className="mb-6 w-full max-w-md">{children}</div>}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3">
          {primaryAction && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={primaryAction.onClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {primaryAction.icon ? (
                <primaryAction.icon className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {primaryAction.label}
            </motion.button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2.5 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Componentes pré-configurados para casos comuns

export function EmptySearchState({
  searchTerm,
  onClear,
}: {
  searchTerm: string;
  onClear: () => void;
}) {
  return (
    <EmptyState
      variant="search"
      title="Nenhum resultado encontrado"
      description={`Não encontramos resultados para "${searchTerm}". Tente buscar por outros termos.`}
      secondaryAction={{
        label: 'Limpar busca',
        onClick: onClear,
      }}
    />
  );
}

export function EmptyFilterState({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      variant="filter"
      title="Nenhum item corresponde aos filtros"
      description="Tente ajustar ou remover alguns filtros para ver mais resultados."
      secondaryAction={{
        label: 'Limpar filtros',
        onClick: onClear,
      }}
    />
  );
}

export function EmptyDataState({
  entityName,
  onAdd,
}: {
  entityName: string;
  onAdd: () => void;
}) {
  return (
    <EmptyState
      variant="default"
      title={`Nenhum ${entityName} cadastrado`}
      description={`Comece criando seu primeiro ${entityName} para ver os dados aqui.`}
      primaryAction={{
        label: `Criar ${entityName}`,
        onClick: onAdd,
      }}
    />
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      variant="error"
      title="Ops! Algo deu errado"
      description={message || 'Não foi possível carregar os dados. Tente novamente.'}
      primaryAction={
        onRetry
          ? {
              label: 'Tentar novamente',
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
}
