'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, AlertTriangle, CheckCircle, Gift, ExternalLink } from 'lucide-react';
import { useSystemName } from '@/contexts/SettingsContext';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'promo';
  actionLabel?: string;
  actionUrl?: string;
  imageUrl?: string;
  dismissible?: boolean;
}

interface AnnouncementsCardProps {
  announcements?: Announcement[];
  showWelcome?: boolean;
}

export default function AnnouncementsCard({
  announcements = [],
  showWelcome = true,
}: AnnouncementsCardProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const systemName = useSystemName();

  // Avisos padrão - inclui boas-vindas se showWelcome = true
  const allAnnouncements = useMemo(() => {
    const welcomeAnnouncement: Announcement = {
      id: 'welcome',
      title: `Bem-vindo ao ${systemName}!`,
      message: 'Comece configurando suas telas e fazendo upload de mídias para exibição.',
      type: 'info',
      dismissible: true,
    };
    return showWelcome ? [welcomeAnnouncement, ...announcements] : announcements;
  }, [systemName, announcements, showWelcome]);

  // Carregar IDs dispensados do localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dismissed_announcements');
    if (stored) {
      try {
        setDismissedIds(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
  };

  // Filtrar avisos nao dispensados
  const visibleAnnouncements = allAnnouncements.filter(
    (a) => !dismissedIds.includes(a.id)
  );

  if (visibleAnnouncements.length === 0) return null;

  const getTypeStyles = (type: Announcement['type']) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: AlertTriangle,
          iconColor: 'text-amber-500',
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-500',
        };
      case 'promo':
        return {
          bg: 'bg-gradient-to-r from-indigo-50 to-purple-50',
          border: 'border-indigo-200',
          icon: Gift,
          iconColor: 'text-indigo-500',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: Info,
          iconColor: 'text-blue-500',
        };
    }
  };

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {visibleAnnouncements.map((announcement) => {
          const styles = getTypeStyles(announcement.type);
          const Icon = styles.icon;

          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`rounded-xl border ${styles.bg} ${styles.border} overflow-hidden`}
            >
              <div className="p-4 flex items-start gap-4">
                {/* Image or Icon */}
                {announcement.imageUrl ? (
                  <img
                    src={announcement.imageUrl}
                    alt=""
                    className="w-24 h-24 object-contain rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${styles.bg}`}
                  >
                    <Icon className={`w-5 h-5 ${styles.iconColor}`} />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {announcement.type === 'promo' && (
                    <span className="inline-block px-2 py-0.5 text-xs font-medium text-indigo-600 bg-indigo-100 rounded mb-2">
                      Novidade
                    </span>
                  )}
                  <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{announcement.message}</p>

                  {announcement.actionLabel && announcement.actionUrl && (
                    <a
                      href={announcement.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      {announcement.actionLabel}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Dismiss Button */}
                {announcement.dismissible !== false && (
                  <button
                    onClick={() => handleDismiss(announcement.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
