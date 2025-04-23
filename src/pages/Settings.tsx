import React, { useState } from 'react';
import { SettingsIcon, AlertIcon } from '../components/Icons';
import { Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import supabase from '../lib/db';
import { useAuth } from '../context/AuthContext';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
}

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [expirationThreshold, setExpirationThreshold] = useState(30);
  const [language, setLanguage] = useState('fr');
  const [activeSection, setActiveSection] = useState<string>('general');
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const { user } = useAuth();

  const sections: SettingsSection[] = [
    {
      id: 'general',
      title: 'Général',
      description: 'Paramètres généraux de l\'application'
    },
    {
      id: 'security',
      title: 'Sécurité',
      description: 'Paramètres de sécurité et de confidentialité'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Gérer les notifications et les alertes'
    },
    {
      id: 'history',
      title: 'Historique',
      description: 'Gérer l\'historique des actions'
    }
  ];

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
      const { error } = await supabase
        .from('key_history')
        .delete()
        .neq('id', 'none'); // Delete all records

      if (error) throw error;

      setShowClearHistoryModal(false);
      toast.success('Historique effacé avec succès');
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Erreur lors de l\'effacement de l\'historique');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Paramètres</h1>
      </div>

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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Apparence</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Mode sombre</span>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${
                        darkMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          darkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Langue</h3>
                <div className="mt-4">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Seuil d'expiration</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Définir le nombre de jours avant d'être notifié de l'expiration d'une clé
                </p>
                <div className="mt-4">
                  <input
                    type="number"
                    value={expirationThreshold}
                    onChange={(e) => setExpirationThreshold(parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                      checked
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Activer l'authentification à deux facteurs
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Masquer les clés API par défaut
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Activer les notifications</span>
                    <button
                      onClick={() => setNotifications(!notifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${
                        notifications ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          notifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pl-4 space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={notifications}
                        disabled={!notifications}
                      />
                      <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Notifications d'expiration de clé
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={notifications}
                        disabled={!notifications}
                      />
                      <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Notifications de modification de clé
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={notifications}
                        disabled={!notifications}
                      />
                      <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Notifications de tentative d'accès
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'history' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Gestion de l'historique</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Exportez ou effacez l'historique des actions sur les clés API
                </p>
                <div className="mt-6 space-y-4">
                  <button
                    onClick={handleExportHistory}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Exporter l'historique
                  </button>
                  
                  <button
                    onClick={() => setShowClearHistoryModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    Effacer l'historique
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
                Effacer l'historique
              </h3>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Êtes-vous sûr de vouloir effacer tout l'historique ? Cette action est irréversible.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearHistoryModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Effacer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;