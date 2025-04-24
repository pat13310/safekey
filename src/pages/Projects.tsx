import React, { useState, useEffect } from "react";
import {
  FolderIcon,
  KeyIcon,
  EditIcon,
  TrashIcon,
  CopyIcon,
} from "../components/Icons";
import supabase from "../lib/db";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { toast } from "sonner";
import eventBus from "../utils/eventBus";
import PageTitle from "../components/PageTitle";

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  key_count: number;
}

interface ProjectKey {
  id: string;
  name: string;
  key_value: string;
  environment: string;
  expires_at: string | null;
  provider: string | null;
  is_active: boolean;
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showProjectKeysModal, setShowProjectKeysModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectKeys, setProjectKeys] = useState<ProjectKey[]>([]);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [editProject, setEditProject] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useLanguage(); // Utiliser la fonction de traduction

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  // Écouter les événements de mise à jour des clés
  useEffect(() => {
    // Fonction de rappel pour recharger les données
    const handleKeyUpdated = () => {
      console.log('Événement de mise à jour des clés reçu dans Projects');
      fetchProjects();
      if (selectedProject) {
        fetchProjectKeys(selectedProject.id);
      }
    };
    
    // S'abonner à l'événement
    eventBus.on('key_updated', handleKeyUpdated);
    
    // Se désabonner lors du démontage du composant
    return () => {
      eventBus.off('key_updated', handleKeyUpdated);
    };
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select(
          `
          id,
          name,
          description,
          created_at,
          updated_at,
          archived_at
        `,
        )
        .eq("created_by", user?.id)
        .is("archived_at", null);

      if (projectsError) throw projectsError;

      const projectsWithKeyCounts = await Promise.all(
        projectsData.map(async (project) => {
          const { count, error: countError } = await supabase
            .from("api_keys")
            .select("id", { count: "exact" })
            .eq("project_id", project.id)
            .eq("is_active", true);

          if (countError) throw countError;

          return {
            ...project,
            key_count: count || 0,
            key_type: 'production',
          };
        }),
      );

      setProjects(projectsWithKeyCounts);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error(t('projects.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectKeys = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjectKeys(data || []);
    } catch (error) {
      console.error("Error fetching project keys:", error);
      toast.error(t('projects.keysLoadingError'));
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            name: newProject.name,
            description: newProject.description || null,
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setProjects((prev) => [...prev, { ...data, key_count: 0 }]);
      setNewProject({ name: "", description: "" });
      setShowNewProjectModal(false);
      toast.success(t('projects.createSuccess').replace('{name}', data.name));
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(t('projects.createError'));
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          name: editProject.name,
          description: editProject.description,
        })
        .eq("id", selectedProject.id);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id
            ? {
                ...p,
                name: editProject.name,
                description: editProject.description,
              }
            : p,
        ),
      );
      setShowEditProjectModal(false);
      toast.success(t('projects.updateSuccess').replace('{name}', editProject.name));
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error(t('projects.updateError'));
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", projectId);

      if (error) throw error;

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setShowDeleteConfirmModal(false);
      toast.success(t('projects.archiveSuccess'));
    } catch (error) {
      console.error("Error archiving project:", error);
      toast.error(t('projects.archiveError'));
    }
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setEditProject({
      name: project.name,
      description: project.description || "",
      
    });
    setShowEditProjectModal(true);
  };

  const openDeleteModal = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteConfirmModal(true);
  };

  const openProjectKeysModal = async (project: Project) => {
    setSelectedProject(project);
    await fetchProjectKeys(project.id);
    setShowProjectKeysModal(true);
  };

  const formatDate = (date: string) => {
    // Utiliser la locale de la langue actuelle
    return new Date(date).toLocaleDateString();
  };

  const getEnvironmentBadgeColor = (environment: string) => {
    switch (environment) {
      case "production":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "staging":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getEnvironmentLabel = (environment: string) => {
    switch (environment) {
      case "production":
        return t('projects.environmentProduction');
      case "staging":
        return t('projects.environmentStaging');
      default:
        return t('projects.environmentDevelopment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <PageTitle 
        title={t('projects.title')} 
        icon={<FolderIcon className="h-6 w-6" />}
        actions={
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg flex items-center space-x-2"
          >
            <span>+ {t('projects.newProject')}</span>
          </button>
        }
      />

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {t('projects.noProjects')}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('projects.noProjectsDesc')}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <FolderIcon className="h-5 w-5 mr-2" />
              Nouveau projet
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => openProjectKeysModal(project)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200 flex flex-col min-h-[280px] cursor-pointer"
            >
              <div className="p-6 flex-grow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                      <FolderIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 h-10">
                        {project.description || t('projects.noDescription')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <KeyIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {project.key_count} {project.key_count > 1 ? t('projects.keysPlural') : t('projects.keys')}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t('projects.modified')}{" "}
                    {formatDate(project.updated_at)}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${getEnvironmentBadgeColor("production")}`}
                  >
                    {getEnvironmentLabel("production")}
                  </span>
                  {project.key_count > 0 && (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {t('projects.active')}
                    </span>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(project);
                  }}
                  className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                  title={t('projects.edit')}
                >
                  <EditIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteModal(project);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                  title={t('projects.archive')}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Keys Modal */}
      {showProjectKeysModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <FolderIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedProject.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedProject.key_count} {selectedProject.key_count > 1 ? t('projects.keysPlural') : t('projects.keys')} {selectedProject.key_count > 1 ? t('projects.activeKeysPlural') : t('projects.activeKeys')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProjectKeysModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('projects.name')}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('projects.key')}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('projects.environment')}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('projects.expiration')}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('projects.provider')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {projectKeys.map((key) => (
                    <tr
                      key={key.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-150 hover:cursor-pointer"
                    >
                      <td className="px-4 py-2">
                        <div className="text-xs font-medium text-gray-900 dark:text-white">
                          {key.name}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <div className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {key.key_value}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(key.key_value);
                              toast.success(t('projects.keyCopied'));
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <CopyIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-thin rounded-full ${getEnvironmentBadgeColor(
                            key.environment,
                          )}`}
                        >
                          {getEnvironmentLabel(key.environment)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                        {key.expires_at
                          ? formatDate(key.expires_at)
                          : t('projects.noExpiration')}
                      </td>
                      <td className="px-4 py-2">
                        {key.provider && (
                          <span className="text-center px-2 py-0.5 text-[10px] font-thin rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {key.provider}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t('projects.createNew')}
            </h2>

            <form onSubmit={handleCreateProject}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t('projects.projectName')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({ ...newProject, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    minLength={3}
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t('projects.description')}
                  </label>
                  <textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>


              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  {t('projects.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                >
                  {t('projects.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t('projects.editProject')}
            </h2>

            <form onSubmit={handleEditProject}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="edit-name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t('projects.projectName')}
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    value={editProject.name}
                    onChange={(e) =>
                      setEditProject({ ...editProject, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    minLength={3}
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t('projects.description')}
                  </label>
                  <textarea
                    id="edit-description"
                    value={editProject.description}
                    onChange={(e) =>
                      setEditProject({
                        ...editProject,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>


              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditProjectModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  {t('projects.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                >
                  {t('projects.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t('projects.deleteProject')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {t('projects.confirmDeleteDesc')}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {t('projects.cancel')}
              </button>
              <button
                onClick={() => handleDeleteProject(selectedProject.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                {t('projects.confirmArchive')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
