import React from 'react';
import { toast } from 'sonner';

// Définir le type ToastOptions localement
type ToastOptions = {
  description?: string;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  icon?: React.ReactNode;
  id?: string | number;
  important?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
};

// Définir le type Settings localement
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
}

// Types de notifications
export enum NotificationType {
  EXPIRATION = 'expiration',
  NEW_KEY = 'newKey',
  LOGIN = 'login',
  GENERAL = 'general'
}

// Fonction pour vérifier si les notifications sont autorisées
const isNotificationAllowed = (settings: Settings, type: NotificationType): boolean => {
  // Si les notifications sont globalement désactivées, aucune notification n'est autorisée
  if (!settings.notifications) {
    return false;
  }

  // Vérification spécifique selon le type de notification
  switch (type) {
    case NotificationType.EXPIRATION:
      return settings.notifyExpiration;
    case NotificationType.NEW_KEY:
      return settings.notifyNewKey;
    case NotificationType.LOGIN:
      return settings.notifyLogin;
    case NotificationType.GENERAL:
      return true; // Les notifications générales sont toujours autorisées si les notifications globales sont activées
    default:
      return true;
  }
};

// Fonction pour obtenir la durée de notification avec limites
const getNotificationDuration = (settings: Settings): number => {
  // Limiter la durée entre 1 et 2.5 secondes
  const duration = settings.notificationDuration || 2; // Valeur par défaut si non définie
  return Math.max(1, Math.min(2.5, duration)) * 1000; // Convertir en millisecondes
};

// Fonctions pour afficher des notifications avec vérification des autorisations
export const showNotification = {
  success: (settings: Settings, message: string, type: NotificationType = NotificationType.GENERAL, options?: ToastOptions) => {
    if (isNotificationAllowed(settings, type)) {
      toast.success(message, {
        ...options,
        duration: getNotificationDuration(settings)
      });
    }
  },
  
  error: (settings: Settings, message: string, type: NotificationType = NotificationType.GENERAL, options?: ToastOptions) => {
    if (isNotificationAllowed(settings, type)) {
      toast.error(message, {
        ...options,
        duration: getNotificationDuration(settings)
      });
    }
  },
  
  info: (settings: Settings, message: string, type: NotificationType = NotificationType.GENERAL, options?: ToastOptions) => {
    if (isNotificationAllowed(settings, type)) {
      toast.info(message, {
        ...options,
        duration: getNotificationDuration(settings)
      });
    }
  },
  
  warning: (settings: Settings, message: string, type: NotificationType = NotificationType.GENERAL, options?: ToastOptions) => {
    if (isNotificationAllowed(settings, type)) {
      toast.warning(message, {
        ...options,
        duration: getNotificationDuration(settings)
      });
    }
  }
};
