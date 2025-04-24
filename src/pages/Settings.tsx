import { useState } from 'react';
import { AlertIcon, SettingsIcon } from '../components/Icons';
import { Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import supabase from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import PageTitle from '../components/PageTitle';
import LanguageSelector from '../components/LanguageSelector';
import { NotificationType, showNotification } from '../utils/notifications';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
}

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { t } = useLanguage(); // Utiliser la fonction de traduction
  const [activeSection, setActiveSection] = useState<string>('general');
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const { user } = useAuth(); // Utilisé pour l'authentification
  
  // Synchroniser l'état local avec le thème global
  const isDarkMode = theme === 'dark';

  // Sections traduites selon la langue sélectionnée
  const sections: SettingsSection[] = [
    {
      id: 'general',
      title: t('settings.sections.general.title'),
      description: t('settings.sections.general.desc')
    },
    {
      id: 'profile',
      title: t('settings.sections.profile.title') || 'Profil',
      description: t('settings.sections.profile.desc') || 'Gérez vos informations personnelles et vos identifiants de connexion.'
    },
    {
      id: 'security',
      title: t('settings.sections.security.title'),
      description: t('settings.sections.security.desc')
    },
    {
      id: 'notifications',
      title: t('settings.sections.notifications.title'),
      description: t('settings.sections.notifications.desc')
    },
    {
      id: 'history',
      title: t('settings.sections.history.title'),
      description: t('settings.sections.history.desc')
    },
    {
      id: 'export',
      title: t('settings.sections.export.title'),
      description: t('settings.sections.export.desc')
    }
  ];

  const handleExportKeys = async (format: 'csv' | 'json') => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*, project:projects(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const keysData = data.map(key => ({
        id: key.id,
        name: key.name,
        key_value: key.key_value ? `${key.key_value.substring(0, 5)}...` : '',
        project: key.project?.name || 'Sans projet',
        environment: key.environment,
        provider: key.provider || 'Personnalisé',
        expires_at: key.expires_at ? new Date(key.expires_at).toLocaleDateString('fr-FR') : 'Jamais',
        is_active: key.is_active ? 'Actif' : 'Inactif',
        created_at: new Date(key.created_at).toLocaleDateString('fr-FR')
      }));

      if (format === 'json') {
        const jsonString = JSON.stringify(keysData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cles-api-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Export JSON réussi');
      } else if (format === 'csv') {
        const headers = ['ID', 'Nom', 'Clé', 'Projet', 'Environnement', 'Fournisseur', 'Expiration', 'Statut', 'Date de création'];
        const csvRows = [
          headers.join(','),
          ...keysData.map(key => [
            key.id,
            `"${key.name}"`,
            key.key_value,
            `"${key.project}"`,
            key.environment,
            `"${key.provider}"`,
            key.expires_at,
            key.is_active,
            key.created_at
          ].join(','))
        ];
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cles-api-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Export CSV réussi');
      }
    } catch (error) {
      console.error('Erreur lors de l\'exportation des clés:', error);
      toast.error('Erreur lors de l\'exportation des clés');
    }
  };

  const handleExportHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('key_history')
        .select('*')
        .order('performed_at', { ascending: false });

      if (error) throw error;

      const historyData = data.map(entry => ({
        date: new Date(entry.performed_at).toLocaleString('fr-FR'),
        action: entry.action,
        project: entry.project_name,
        environment: entry.environment,
        details: entry.details,
      }));

      const jsonString = JSON.stringify(historyData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `historique-api-keys-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Historique exporté avec succès');
    } catch (error) {
      console.error('Error exporting history:', error);
      toast.error('Erreur lors de l\'exportation de l\'historique');
    }
  };

  const handleClearHistory = async () => {
    try {
      const userId = user?.id;
      if (!userId) {
        showNotification.error(settings, t('settings.userNotFound'), NotificationType.GENERAL);
        return;
      }

      setShowClearHistoryModal(false); // Fermer la boîte de dialogue immédiatement pour améliorer l'UX
      
      // Afficher un toast de chargement
      const toastId = toast.loading('Suppression de l\'historique en cours...');
      
      try {
        // Utiliser la nouvelle fonction spécialisée pour supprimer l'historique
        const { queries } = await import('../lib/db');
        const result = await queries.clearKeyHistory(userId);
        
        // Fermer le toast de chargement
        toast.dismiss(toastId);
        
        console.log('Résultat de la suppression:', result);
        
        // Préparer un message détaillé pour l'utilisateur
        const totalEntries = result.stats.totalHistoryEntries;
        const keySummary = result.stats.keySummary;
        
        // Créer un message plus informatif
        let message = '';
        
        if (totalEntries === 0) {
          message = 'Aucune entrée d\'historique à supprimer';
        } else {
          message = `${totalEntries} entrées d'historique supprimées`;
          
          // Ajouter des détails sur les clés si disponibles
          if (keySummary && keySummary.length > 0) {
            // Limiter à 3 clés maximum pour éviter un message trop long
            const topKeys = keySummary
              .filter(k => k.actions > 0)
              .sort((a, b) => b.actions - a.actions)
              .slice(0, 3);
            
            if (topKeys.length > 0) {
              message += '\nClés principales : ' + 
                topKeys.map(k => `${k.nom} (${k.actions} actions)`).join(', ');
            }
          }
        }
        
        // Afficher le message approprié
        if (result.stats.errorCount > 0) {
          showNotification.warning(
            settings, 
            message, 
            NotificationType.GENERAL
          );
        } else {
          showNotification.success(settings, message, NotificationType.GENERAL);
        }
      } catch (error) {
        // Fermer le toast de chargement en cas d'erreur
        toast.dismiss(toastId);
        
        // Essayer une approche de secours en cas d'échec de la méthode principale
        try {
          console.log('Tentative de suppression directe après échec de la méthode principale');
          
          // Suppression directe avec privilèges standard
          const { error: deleteError } = await supabase
            .from('key_history')
            .delete()
            .eq('performed_by', userId);
          
          if (deleteError) {
            console.error('Erreur lors de la suppression directe:', deleteError);
            throw deleteError;
          }
          
          showNotification.success(settings, t('settings.clearHistorySuccess'), NotificationType.GENERAL);
        } catch (backupError) {
          console.error('Erreur lors de la méthode de secours:', backupError);
          throw error; // Relancer l'erreur originale
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'historique:', error);
      showNotification.error(settings, t('settings.clearHistoryError'), NotificationType.GENERAL);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <PageTitle 
        title={t('settings.title')} 
        icon={<SettingsIcon className="h-6 w-6" />}
      />

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  activeSection === section.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span>{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          {activeSection === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.appearance')}</h3>
                <div className="mt-4 space-y-4">
                  <div className="toggle-container">
                    <span className="toggle-label">
                      {!isDarkMode ? t('sidebar.lightMode') : t('sidebar.darkMode')}
                    </span>
                    <button
                      onClick={toggleTheme}
                      className={`toggle ${isDarkMode ? 'checked' : ''}`}
                      aria-checked={isDarkMode}
                      role="switch"
                    >
                      <span className="toggle-thumb" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.language')}</h3>
                <div className="mt-4">
                  <LanguageSelector className="w-1/2" />
                </div>
                <p className="px-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t('settings.languageDescription')}
                </p>
              </div>
            </div>
          )}
          
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.profile.personalInfo')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('settings.profile.personalInfoDesc')}
                </p>
                
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.profile.email')}</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        type="email"
                        defaultValue={user?.email || ''}
                        id="userEmail"
                        className="px-2 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="mt-2">
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={async () => {
                          try {
                            const email = (document.getElementById('userEmail') as HTMLInputElement)?.value;
                            if (!email) {
                              toast.error(
                                `${t('toast.error.validation')}\n` +
                                `${t('toast.error.emptyEmail')}`
                              );
                              return;
                            }
                            
                            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                              toast.error(
                                `${t('toast.error.validation')}\n` +
                                `${t('toast.error.invalidEmail')}`
                              );
                              return;
                            }
                            
                            const { error } = await supabase.auth.updateUser({ email });
                            
                            if (error) {
                              throw error;
                            }
                            
                            toast.success(
                              `${t('toast.success.request')}\n` +
                              `${t('toast.success.emailSent')}\n` +
                              `${t('toast.success.checkInbox')}`
                            );
                          } catch (error) {
                            console.error("Erreur lors de la mise à jour de l'adresse e-mail:", error);
                            toast.error(
                              `${t('toast.error.update')}\n` +
                              `${t('toast.error.emailUpdate')}`
                            );
                          }
                        }}
                      >
                        {t('settings.update')}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('settings.profile.emailUpdateDesc')}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.profile.username')}</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          defaultValue={user?.user_metadata?.full_name || ''}
                          id="userName"
                          className="px-2 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="mt-2">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={async () => {
                            try {
                              const userName = (document.getElementById('userName') as HTMLInputElement)?.value;
                              if (!userName) {
                                toast.error(
                                  `${t('toast.error.validation')}\n` +
                                  `${t('toast.error.emptyUsername')}`
                                );
                                return;
                              }
                              
                              const { error } = await supabase.auth.updateUser({
                                data: { full_name: userName }
                              });
                              
                              if (error) {
                                throw error;
                              }
                              
                              toast.success(
                                `${t('toast.success.update')}\n` +
                                `${t('toast.success.usernameUpdate')}`
                              );
                            } catch (error) {
                              console.error("Erreur lors de la mise à jour du nom d'utilisateur:", error);
                              toast.error(
                                `${t('toast.error.update')}\n` +
                                `${t('toast.error.usernameUpdate')}`
                              );
                            }
                          }}
                        >
                          {t('settings.save')}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.profile.registrationDate')}</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          value={user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : ''}
                          readOnly
                          className="px-2 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-5 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.profile.security')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('settings.profile.securityDesc')}
                </p>
                
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.profile.currentPassword')}</label>
                    <div className="mt-1 max-w-md">
                      <input
                        type="password"
                        id="currentPassword"
                        defaultValue=""
                        className="px-2 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.profile.newPassword')}</label>
                      <div className="mt-1">
                        <input
                          type="password"
                          id="newPassword"
                          defaultValue=""
                          className="px-2 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.profile.confirmPassword')}</label>
                      <div className="mt-1">
                        <input
                          type="password"
                          id="confirmPassword"
                          defaultValue=""
                          className="px-2 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={async () => {
                        try {
                          const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement)?.value;
                          const newPassword = (document.getElementById('newPassword') as HTMLInputElement)?.value;
                          const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement)?.value;
                          
                          // Vérifications
                          if (!currentPassword || !newPassword || !confirmPassword) {
                            toast.error(
                              `${t('toast.error.validation')}\n` +
                              `${t('toast.error.requiredFields')}`
                            );
                            return;
                          }
                          
                          if (newPassword !== confirmPassword) {
                            toast.error(
                              `${t('toast.error.validation')}\n` +
                              `${t('toast.error.passwordMismatch')}`
                            );
                            return;
                          }
                          
                          if (newPassword.length < 8) {
                            toast.error(
                              `${t('toast.error.validation')}\n` +
                              `${t('toast.error.passwordLength')}`
                            );
                            return;
                          }
                          
                          // Mettre à jour le mot de passe
                          const { error } = await supabase.auth.updateUser({
                            password: newPassword
                          });
                          
                          if (error) {
                            throw error;
                          }
                          
                          // Réinitialiser les champs
                          (document.getElementById('currentPassword') as HTMLInputElement).value = '';
                          (document.getElementById('newPassword') as HTMLInputElement).value = '';
                          (document.getElementById('confirmPassword') as HTMLInputElement).value = '';
                          
                          toast.success(
                            `${t('toast.success.update')}\n` +
                            `${t('toast.success.passwordUpdate')}`
                          );
                        } catch (error) {
                          console.error("Erreur lors de la mise à jour du mot de passe:", error);
                          toast.error(
                            `${t('toast.error.update')}\n` +
                            `${t('toast.error.passwordUpdate')}`
                          );
                        }
                      }}
                    >
                      {t('settings.profile.changePassword')}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="pt-5 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.profile.contactPreferences')}</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="emailNotifications" className="text-sm text-gray-700 dark:text-gray-300">
                      {t('settings.profile.emailNotifications')}
                    </label>
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onChange={(e) => updateSettings({ emailNotifications: e.target.checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="marketingEmails" className="text-sm text-gray-700 dark:text-gray-300">
                      {t('settings.profile.marketingEmails')}
                    </label>
                    <input
                      type="checkbox"
                      id="marketingEmails"
                      checked={settings.marketingEmails}
                      onChange={(e) => updateSettings({ marketingEmails: e.target.checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.expirationThreshold')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('settings.expirationThresholdDesc')}
                </p>
                <div className="mt-4">
                  <input
                    type="number"
                    value={settings.expirationThreshold}
                    onChange={(e) => updateSettings({ expirationThreshold: parseInt(e.target.value) })}
                    className="px-2 mt-1 block rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    min="1"
                    max="90"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sécurité</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={settings.twoFactorAuth}
                      onChange={(e) => updateSettings({ twoFactorAuth: e.target.checked })}
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      {t('settings.confirm')} {t('settings.twoFactorAuth')}
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={settings.hideApiKeys}
                      onChange={(e) => updateSettings({ hideApiKeys: e.target.checked })}
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      {t('settings.hideApiKeys')}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.notifications')}</h3>
                <div className="mt-4 space-y-4">
                  <div className="toggle-container">
                    <span className="toggle-label">{t('settings.enableNotifications')}</span>
                    <button
                      onClick={() => updateSettings({ notifications: !settings.notifications })}
                      className={`toggle ${settings.notifications ? 'checked' : ''}`}
                      aria-checked={settings.notifications}
                      role="switch"
                    >
                      <span className="toggle-thumb" />
                    </button>
                  </div>

                  <div className="pl-4 space-y-4">
                    {/* Durée des notifications */}
                    <div className="flex flex-col space-y-2">
                      <label className="block text-sm text-gray-700 dark:text-gray-300">
                        Durée des notifications (1-2.5 secondes)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="1"
                          max="2.5"
                          step="0.1"
                          value={settings.notificationDuration}
                          onChange={(e) => updateSettings({ notificationDuration: parseFloat(e.target.value) })}
                          className="w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          disabled={!settings.notifications}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {settings.notificationDuration.toFixed(1)}s
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={settings.notifyExpiration}
                        onChange={(e) => updateSettings({ notifyExpiration: e.target.checked })}
                        disabled={!settings.notifications}
                      />
                      <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        {t('settings.notifyExpiration')}
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={settings.notifyNewKey}
                        onChange={(e) => updateSettings({ notifyNewKey: e.target.checked })}
                        disabled={!settings.notifications}
                      />
                      <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        {t('settings.notifyNewKey')}
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={settings.notifyLogin}
                        onChange={(e) => updateSettings({ notifyLogin: e.target.checked })}
                        disabled={!settings.notifications}
                      />
                      <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        {t('settings.notifyLogin')}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.exportKeys')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('settings.exportKeysDesc')}
                </p>
                <div className="mt-6 space-y-4">
                  <button
                    onClick={() => handleExportKeys('csv')}
                    className="w-1/2 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {t('settings.exportAsCSV')}
                  </button>
                  
                  <button
                    onClick={() => handleExportKeys('json')}
                    className="w-1/2 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {t('settings.exportAsJSON')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'history' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.clearHistory')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('settings.clearHistoryDesc')}
                </p>
                <div className="mt-6 space-y-4">
                  <button
                    onClick={handleExportHistory}
                    className="w-1/2 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {t('settings.exportHistory')}
                  </button>
                  
                  <button
                    onClick={() => setShowClearHistoryModal(true)}
                    className="w-1/2 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    {t('settings.clearHistory')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clear History Confirmation Modal */}
      {showClearHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <AlertIcon className="h-6 w-6 text-red-600 dark:text-red-200" />
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                {t('settings.clearHistory')}
              </h3>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('settings.clearHistoryConfirm')} {t('settings.clearHistoryWarning')}
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearHistoryModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {t('settings.cancel')}
              </button>
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                {t('settings.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;