import React, { useState, useEffect } from 'react';
import { HistoryIcon } from '../components/Icons';
import supabase from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import PageTitle from '../components/PageTitle';

interface HistoryEntry {
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'viewed' | 'rotated';
  api_key_id: string;
  performed_at: string;
  details: {
    name: string;
    project_id: string;
    expires_at: string | null;
    is_active: boolean;
    changes?: {
      name?: { old: string; new: string };
      expires_at?: { old: string; new: string };
      is_active?: { old: boolean; new: boolean };
      environment?: { old: string; new: string };
    };
  };
  environment: string;
  key_type: string;
  provider: string;
  project_name: string;
}

const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useLanguage(); // Utiliser la fonction de traduction

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('key_history')
        .select(`
          id,
          action,
          api_key_id,
          performed_at,
          details,
          environment,
          key_type,
          provider,
          project_name
        `)
        .order('performed_at', { ascending: false });

      if (error) throw error;

      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    // Utiliser la locale du navigateur pour le format de date
    return new Date(date).toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created':
        return t('history.action.created');
      case 'updated':
        return t('history.action.updated');
      case 'deleted':
        return t('history.action.deleted');
      case 'viewed':
        return t('history.action.viewed');
      case 'rotated':
        return t('history.action.rotated');
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'updated':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'deleted':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'viewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'rotated':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getActionDetails = (entry: HistoryEntry) => {
    // Récupérer le nom de la clé depuis les détails
    const keyName = entry.details?.name || '';
    
    // Préparer un préfixe avec le nom de la clé s'il est disponible
    const keyPrefix = keyName ? `"${keyName}" - ` : '';
    
    switch (entry.action) {
      case 'created':
        return `${keyPrefix}${t('history.details.created').replace('{project}', entry.project_name || t('history.defaultProject'))}`;
      case 'updated':
        if (entry.details?.changes) {
          const changes = [];
          if (entry.details.changes.name?.old && entry.details.changes.name?.new) {
            changes.push(t('history.details.nameChanged')
              .replace('{old}', entry.details.changes.name.old)
              .replace('{new}', entry.details.changes.name.new));
          }
          if (entry.details.changes.environment?.old && entry.details.changes.environment?.new) {
            changes.push(t('history.details.environmentChanged')
              .replace('{old}', entry.details.changes.environment.old)
              .replace('{new}', entry.details.changes.environment.new));
          }
          if (entry.details.changes.is_active !== undefined) {
            const oldValue = entry.details.changes.is_active?.old;
            const newValue = entry.details.changes.is_active?.new;
            if (oldValue !== undefined && newValue !== undefined) {
              changes.push(t('history.details.statusChanged')
                .replace('{status}', newValue ? t('history.details.active') : t('history.details.inactive')));
            }
          }
          return `${keyPrefix}${changes.length > 0 ? changes.join(', ') : t('history.details.updated')}`;
        }
        return `${keyPrefix}${t('history.details.updated')}`;
      case 'deleted':
        return `${keyPrefix}${t('history.details.deleted')}`;
      case 'viewed':
        return `${keyPrefix}${t('history.details.viewed')}`;
      case 'rotated':
        return `${keyPrefix}${t('history.details.rotated')}`;
      default:
        return keyName || '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-300">{t('history.loading')}</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <PageTitle 
        title={t('history.title')} 
        icon={<HistoryIcon className="h-6 w-6" />} 
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('history.date')}
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('history.action')}
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('history.project')}
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('history.environment')}
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('history.details')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {history.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(entry.performed_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${getActionColor(entry.action)}`}>
                      {getActionLabel(entry.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                      {entry.project_name || t('history.defaultProject')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      entry.environment === 'production'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : entry.environment === 'staging'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {entry.environment === 'production' ? t('history.environment.production') :
                       entry.environment === 'staging' ? t('history.environment.staging') : t('history.environment.development')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {getActionDetails(entry)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;