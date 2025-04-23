import React, { useState, useEffect } from 'react';
import { EditIcon, TrashIcon, ViewIcon, CopyIcon, AlertIcon } from './Icons';
import { toast } from 'sonner';
import supabase from '../lib/db';

export interface KeyData {
  id: string;
  name: string;
  key: string;
  project: string;
  expirationDate: string;
  environment?: string;
  key_type?: string;
  project_id?: string;
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
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (showEditModal || showKeyDetails) {
      fetchProjects();
    }
  }, [showEditModal, showKeyDetails]);

  useEffect(() => {
    if (editFormData.project_id && !showNewProjectInput) {
      const project = projects.find((p) => p.id === editFormData.project_id);
      setSelectedProject(project || null);
    }
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
      toast.error('Erreur lors du chargement des projets');
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
        text: 'Expirée',
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      };
    } else if (daysUntilExpiration <= 30) {
      return {
        text: `Expire dans ${daysUntilExpiration} jour${
          daysUntilExpiration > 1 ? 's' : ''
        }`,
        className:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      };
    } else {
      return {
        text: `Expire dans ${daysUntilExpiration} jours`,
        className:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      };
    }
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      toast.success('Clé copiée dans le presse-papier');
    } catch (err) {
      console.error('Failed to copy key:', err);
      toast.error('Erreur lors de la copie de la clé');
    }
  };

  const handleDelete = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = (id: string) => {
    const keyToDelete = keys.find((k) => k.id === id);
    onDeleteKey(id);
    setShowDeleteConfirm(null);
    toast.success('Clé API supprimée', {
      description: `La clé "${keyToDelete?.name}" a été supprimée avec succès.`,
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
      toast.error('Erreur lors de la préparation du formulaire');
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

      toast.success('Clé API modifiée avec succès');
      setShowEditModal(false);
      setEditingKey(null);
      setNewProject('');
      setShowNewProjectInput(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error updating API key:', error);
      toast.error('Erreur lors de la modification de la clé');
    }
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setShowNewProjectInput(true);
      setEditFormData((prev) => ({ ...prev, project_id: '' }));
      setSelectedProject(null);
    } else {
      setShowNewProjectInput(false);
      setEditFormData((prev) => ({ ...prev, project_id: value }));
      const project = projects.find((p) => p.id === value);
      setSelectedProject(project || null);
    }
  };

  const getProjectName = (projectId: string) => {
    if (projectId === '00000000-0000-0000-0000-000000000000') {
      return 'Projet par défaut';
    }
    return projects.find((p) => p.id === projectId)?.name || 'Projet inconnu';
  };

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
                Expiration
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[10%]"
              >
                Actions
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
                          className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded cursor-pointer group relative"
                          onMouseEnter={() => setHoveredKey(keyData.key)}
                          onMouseLeave={() => setHoveredKey(null)}
                        >
                          <div className="truncate max-w-[200px]">
                            {keyData.key}
                          </div>
                          {hoveredKey === keyData.key && (
                            <div className="absolute left-0 right-0 -bottom-8 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-normal break-all ">
                              {keyData.key}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyKey(keyData.key)}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-900"
                        title="Copier"
                      >
                        <CopyIcon className="h-4 w-4" />
                      </button>
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
            Précédent
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
            Suivant
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer cette clé API ? Cette action
              est irréversible.
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
                Supprimer
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
                Détails de la clé API
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
                      Clé API
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className="flex-1 text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md truncate">
                        {keys.find((k) => k.id === showKeyDetails)?.key}
                      </p>
                      <button
                        onClick={() =>
                          handleCopyKey(
                            keys.find((k) => k.id === showKeyDetails)?.key || ''
                          )
                        }
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
                      Statut d'expiration
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
                Modifier la clé API
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
