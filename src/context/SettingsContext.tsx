import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface Settings {
  language: string;
  notifications: boolean;
  expirationThreshold: number;
  hideApiKeys: boolean;
  twoFactorAuth: boolean;
  notifyExpiration: boolean;
  notifyNewKey: boolean;
  notifyLogin: boolean;
  notificationDuration: number; // Durée des notifications en secondes
  emailNotifications: boolean; // Recevoir des notifications par e-mail
  marketingEmails: boolean; // Recevoir des e-mails marketing et des mises à jour
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  language: 'fr',
  notifications: true,
  expirationThreshold: 30,
  hideApiKeys: true,
  twoFactorAuth: false,
  notifyExpiration: true,
  notifyNewKey: true,
  notifyLogin: true,
  notificationDuration: 2, // Valeur par défaut : 2 secondes
  emailNotifications: false, // Désactivé par défaut
  marketingEmails: false, // Désactivé par défaut
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('settings');
      if (savedSettings) {
        try {
          return { ...defaultSettings, ...JSON.parse(savedSettings) };
        } catch (e) {
          console.error('Error parsing settings from localStorage:', e);
        }
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
