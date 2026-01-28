'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface SystemSettings {
  systemName: string;
  systemLogo: string;
  supportEmail: string;
  supportPhone: string;
}

interface SettingsContextType {
  settings: SystemSettings;
  loading: boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_SETTINGS: SystemSettings = {
  systemName: 'BoxPratico',
  systemLogo: '',
  supportEmail: '',
  supportPhone: '',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refresh: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          systemName: data.systemName || DEFAULT_SETTINGS.systemName,
          systemLogo: data.systemLogo || DEFAULT_SETTINGS.systemLogo,
          supportEmail: data.supportEmail || DEFAULT_SETTINGS.supportEmail,
          supportPhone: data.supportPhone || DEFAULT_SETTINGS.supportPhone,
        });
      }
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSystemSettings must be used within a SettingsProvider');
  }
  return context;
}

// Hook simples para obter apenas o nome do sistema
export function useSystemName() {
  const { settings } = useSystemSettings();
  return settings.systemName;
}
