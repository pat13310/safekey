import React, { useState, useEffect } from 'react';
import { EditIcon, TrashIcon, ViewIcon, CopyIcon, AlertIcon, EyeOffIcon } from './Icons';
import supabase from '../lib/db';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { showNotification, NotificationType } from '../utils/notifications';

export interface KeyData {
  id: string;
  name: string;
  key: string;
  project: string;
  expirationDate: string;
  environment?: string;
  key_type?: string;
  project_id?: string;
  provider?: string | null;
  isActive?: boolean;
  copied?: boolean; // Pour indiquer si la clé a été copiée récemment
}

interface KeyTableProps {
  keys: KeyData[];
  currentPage: number;
  totalKeys: number;
  keysPerPage: number;
  onPageChange: (page: number) => void;
  onDeleteKey: (id: string) => void;
  onUpdate?: () => void;
}

interface EditFormData {
  name: string;
  key: string;
  project_id: string;
  environment: string;
}

interface Project {
  id: string;
  name: string;
}

const KeyTable: React.FC<KeyTableProps> = ({
  keys,
  currentPage,
  totalKeys,
  keysPerPage,
  onPageChange,
  onDeleteKey,
  onUpdate,
}) => {
  const { t } = useLanguage(); // Utiliser la fonction de traduction
  const { settings } = useSettings(); // Récupérer les paramètres
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  // copiedKey est utilisé pour l'animation visuelle lors de la copie
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [showKeyDetails, setShowKeyDetails] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    key: '',
    project_id: '',
    environment: '',
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProject, setNewProject] = useState('');

  useEffect(() => {
    if (showEditModal || showKeyDetails) {
      fetchProjects();
    }
  }, [showEditModal, showKeyDetails]);

  useEffect(() => {
    // Effet pour gérer le changement de projet sélectionné
  }, [editFormData.project_id, projects, showNewProjectInput]);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('id, name')
        .is('archived_at', null)
        .order('name');

      if (error) throw error;
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showNotification.error(settings, t('dashboard.loadingError'), NotificationType.GENERAL);
    }
  };

  const isKeyExpired = (expirationDate: string): boolean => {
    const [day, month, year] = expirationDate.split('/').map(Number);
    const expDate = new Date(year, month - 1, day);
    return expDate < new Date();
  };

  const getDaysUntilExpiration = (expirationDate: string): number => {
    const [day, month, year] = expirationDate.split('/').map(Number);
    const expDate = new Date(year, month - 1, day);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpirationStatus = (expirationDate: string) => {
    const daysUntilExpiration = getDaysUntilExpiration(expirationDate);

    if (daysUntilExpiration < 0) {
      return {
        text: t('dashboard.expired'),
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      };
    } else if (daysUntilExpiration <= 30) {
      return {
        text: t('dashboard.expiresIn').replace('{days}', daysUntilExpiration.toString()),
        className:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      };
    } else {
      return {
        text: t('dashboard.expiresIn').replace('{days}', daysUntilExpiration.toString()),
        className:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      };
    }
  };

  const handleCopyKey = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    showNotification.success(settings, t('dashboard.keyCopied'), NotificationType.GENERAL);
    
    // Activer l'effet visuel vert
    setCopiedKeyId(keyId);
    
    // Désactiver l'effet après 2 secondes
    setTimeout(() => {
      setCopiedKeyId(null);
    }, 2000);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) =>
      prev.includes(keyId) ? prev.filter((id) => id !== keyId) : [...prev, keyId]
    );
  };

  const handleDelete = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = (id: string) => {
    const keyToDelete = keys.find((k) => k.id === id);
    onDeleteKey(id);
    setShowDeleteConfirm(null);
    showNotification.success(settings, t('dashboard.keyDeleted'), NotificationType.GENERAL, {
      description: `${t('dashboard.keyDeletedDesc')} "${keyToDelete?.name}"`,
    });
  };

  const handleView = (id: string) => {
    setShowKeyDetails(id);
  };

  const handleEdit = async (keyData: KeyData) => {
    try {
      const projectId =
        keyData.project_id ||
        (keyData.project === 'Projet par défaut'
          ? '00000000-0000-0000-0000-000000000000'
          : (
              await supabase
                .from('projects')
                .select('id')
                .eq('name', keyData.project)
                .single()
            ).data?.id);

      setEditingKey(keyData.id);
      setEditFormData({
        name: keyData.name,
        key: keyData.key,
        project_id: projectId || '00000000-0000-0000-0000-000000000000',
        environment: keyData.environment || 'production',
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error preparing edit form:', error);
      showNotification.error(settings, t('dashboard.prepareEditError'), NotificationType.GENERAL);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let projectId = editFormData.project_id;

      // Create new project if needed
      if (showNewProjectInput && newProject) {
        const { data: newProjectData, error: projectError } = await supabase
          .from('projects')
          .insert([
            {
              name: newProject,
              created_by: (await supabase.auth.getUser()).data.user?.id,
            },
          ])
          .select()
          .single();

        if (projectError) throw projectError;
        projectId = newProjectData.id;
      }

      const { error } = await supabase
        .from('api_keys')
        .update({
          name: editFormData.name,
          key_value: editFormData.key,
          project_id: projectId,
          environment: editFormData.environment,
        })
        .eq('id', editingKey);

      if (error) throw error;

      // Refresh data after update
      if (onUpdate) {
        onUpdate();
      }

      showNotification.success(settings, t('dashboard.keyUpdated'), NotificationType.GENERAL);
      setShowEditModal(false);
      setEditingKey(null);
      setNewProject('');
      setShowNewProjectInput(false);
    } catch (error) {
      console.error('Error updating API key:', error);
      showNotification.error(settings, t('dashboard.updateError'), NotificationType.GENERAL);
    }
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setShowNewProjectInput(true);
      setEditFormData((prev) => ({ ...prev, project_id: '' }));
    } else {
      setShowNewProjectInput(false);
      setEditFormData((prev) => ({ ...prev, project_id: value }));
    }
  };

  // Fonction supprimée car non utilisée

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[20%]"
              >
                Nom
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[35%]"
              >
                Clé API
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[20%]"
              >
                Projet
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[15%]"
              >
                {t('dashboard.expiration')}
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[10%]"
              >
                {t('dashboard.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {keys.map((keyData) => {
              const expirationStatus = getExpirationStatus(
                keyData.expirationDate
              );

              return (
                <tr
                  key={keyData.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-150 hover:cursor-pointer"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-7 w-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs">
                        {keyData.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-2">
                        <div className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                          {keyData.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center space-x-1">
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-xs ${copiedKeyId === keyData.id ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'} font-mono ${copiedKeyId === keyData.id ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'} px-2 py-1 rounded cursor-pointer group relative transition-colors duration-200`}
                          onMouseEnter={() => visibleKeys.includes(keyData.id) || !settings.hideApiKeys ? setHoveredKey(keyData.key) : null}
                          onMouseLeave={() => setHoveredKey(null)}
                        >
                          <div className="truncate max-w-[200px]">
                            {visibleKeys.includes(keyData.id) || !settings.hideApiKeys 
                              ? keyData.key 
                              : <>
                                  <span>{keyData.key.substring(0, 4)}</span>
                                  <span className="filter blur-sm select-none">{keyData.key.substring(4, keyData.key.length - 4)}</span>
                                  <span>{keyData.key.substring(keyData.key.length - 4)}</span>
                                </>
                            }
                          </div>
                          {hoveredKey === keyData.key && (visibleKeys.includes(keyData.id) || !settings.hideApiKeys) && (
                            <div className="absolute left-0 right-0 -bottom-8 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-normal break-all ">
                              {keyData.key}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {/* Toujours afficher le bouton, même si l'option de masquage est désactivée */}
                        <button
                          onClick={() => toggleKeyVisibility(keyData.id)}
                          className={`flex-shrink-0 p-1 ${!settings.hideApiKeys && !visibleKeys.includes(keyData.id) ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'} rounded hover:bg-gray-100 dark:hover:bg-gray-900`}
                          title={visibleKeys.includes(keyData.id) ? "Masquer" : "Afficher"}
                          disabled={!settings.hideApiKeys && !visibleKeys.includes(keyData.id)}
                        >
                          {visibleKeys.includes(keyData.id) ? <EyeOffIcon className="h-4 w-4" /> : <ViewIcon className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleCopyKey(keyData.key, keyData.id)}
                          className={`flex-shrink-0 p-1 ${copiedKeyId === keyData.id ? 'text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'} rounded transition-colors duration-200`}
                          title="Copier"
                        >
                          <CopyIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex px-2 py-1 text-[10px] font-thin rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 truncate max-w-[120px]">
                      {keyData.project}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center">
                      {isKeyExpired(keyData.expirationDate) && (
                        <AlertIcon className="h-3 w-3 text-red-500 mr-1 flex-shrink-0" />
                      )}
                      <span
                        className={`px-2 py-1 text-[10px] font-thin rounded-full ${expirationStatus.className} truncate max-w-[100px]`}
                      >
                        {expirationStatus.text}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => handleView(keyData.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-900"
                        title="Voir les détails"
                      >
                        <ViewIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(keyData)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Modifier"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(keyData.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="h-8"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="text-sm text-gray-700 dark:text-gray-300"></div>
        <div className="flex space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors duration-150 ${
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 border border-gray-300 dark:border-gray-600'
            }`}
          >
            {t('dashboard.previous')}
          </button>

          {Array.from(
            { length: Math.ceil(totalKeys / keysPerPage) },
            (_, i) => i + 1
          ).map((number) => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors duration-150 ${
                currentPage === number
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 border border-gray-300 dark:border-gray-600'
              }`}
            >
              {number}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === Math.ceil(totalKeys / keysPerPage)}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors duration-150 ${
              currentPage === Math.ceil(totalKeys / keysPerPage)
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 border border-gray-300 dark:border-gray-600'
            }`}
          >
            {t('dashboard.next')}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('dashboard.confirmDelete')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {t('dashboard.confirmDeleteMessage')}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                {t('dashboard.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Key Details Modal */}
      {showKeyDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('dashboard.keyDetails')}
              </h3>
              <button
                onClick={() => setShowKeyDetails(null)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {keys.find((k) => k.id === showKeyDetails) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {keys.find((k) => k.id === showKeyDetails)?.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('dashboard.apiKey')}
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className="flex-1 text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md truncate">
                        {keys.find((k) => k.id === showKeyDetails)?.key}
                      </p>
                      <button
                        onClick={() => {
                          const key = keys.find((k) => k.id === showKeyDetails);
                          if (key) {
                            handleCopyKey(key.key, key.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 flex-shrink-0"
                        title="Copier"
                      >
                        <CopyIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Projet
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {keys.find((k) => k.id === showKeyDetails)?.project}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('dashboard.expirationStatus')}
                    </label>
                    {(() => {
                      const key = keys.find((k) => k.id === showKeyDetails);
                      if (key) {
                        const status = getExpirationStatus(key.expirationDate);
                        return (
                          <span
                            className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${status.className}`}
                          >
                            {status.text}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('dashboard.editKey')}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Clé API
                  </label>
                  <input
                    type="text"
                    value={editFormData.key}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, key: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Projet
                  </label>
                  <select
                    value={
                      showNewProjectInput ? 'new' : editFormData.project_id
                    }
                    onChange={handleProjectChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="00000000-0000-0000-0000-000000000000">
                      Projet par défaut
                    </option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    <option value="new">+ Nouveau projet</option>
                  </select>
                </div>

                {showNewProjectInput && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom du nouveau projet
                    </label>
                    <input
                      type="text"
                      value={newProject}
                      onChange={(e) => setNewProject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      required={showNewProjectInput}
                      placeholder="ex: Site e-commerce"
                      minLength={3}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Environnement
                  </label>
                  <select
                    value={editFormData.environment}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        environment: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="production">Production</option>
                    <option value="development">Développement</option>
                    <option value="staging">Test</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyTable;
