import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { queries } from '../lib/db';
import type { ApiKey } from '../lib/db';
import supabase from '../lib/db';

interface Project {
  id: string;
  name: string;
}

interface NewKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; key: string; project?: string; projectType: string }) => void;
}

const NewKeyModal: React.FC<NewKeyModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [project, setProject] = useState('');
  const [projectType, setProjectType] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; message: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState('');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

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

  const validateOpenAIKey = async (apiKey: string) => {
    setIsValidating(true);
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        setValidationResult({ isValid: false, message: 'Clé OpenAI invalide ou expirée' });
        toast.error('Clé OpenAI invalide', {
          description: 'La clé API fournie est invalide ou a expiré.'
        });
      } else if (response.ok) {
        setValidationResult({ isValid: true, message: 'Clé OpenAI valide' });
        toast.success('Clé OpenAI valide', {
          description: 'La clé API a été validée avec succès.'
        });
      }
    } catch (error) {
      setValidationResult({ isValid: false, message: 'Erreur lors de la vérification' });
      toast.error('Erreur de validation', {
        description: 'Impossible de vérifier la clé API. Veuillez réessayer.'
      });
    }
    setIsValidating(false);
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKey(value);
    setValidationResult(null);
    
    if (value.startsWith('sk-')) {
      validateOpenAIKey(value);
    }
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setShowNewProjectInput(true);
      setProject('');
    } else {
      setShowNewProjectInput(false);
      setProject(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      let projectId = project;

      // Si c'est un nouveau projet, on le crée d'abord
      if (showNewProjectInput && newProject) {
        const { data: newProjectData, error: projectError } = await supabase
          .from('projects')
          .insert([{
            name: newProject,
            created_by: user.id
          }])
          .select()
          .single();

        if (projectError) throw projectError;
        projectId = newProjectData.id;
      }

      let expirationDate = new Date();
      if (key.startsWith('sk-')) {
        expirationDate.setMonth(expirationDate.getMonth() + 3);
      }

      const newApiKey: Omit<ApiKey, 'id' | 'created_at' | 'updated_at'> = {
        name,
        key_value: key,
        project_id: projectId || '00000000-0000-0000-0000-000000000000',
        created_by: user.id,
        expires_at: key.startsWith('sk-') ? expirationDate : null,
        last_used_at: null,
        is_active: true,
        key_type: projectType as 'development' | 'staging' | 'production',
        provider: key.startsWith('sk-') ? 'openai' : null,
        environment: projectType as 'development' | 'staging' | 'production'
      };

      const createdKey = await queries.createApiKey(newApiKey);

      await queries.addKeyHistory({
        api_key_id: createdKey.id,
        action: 'created',
        performed_by: user.id,
        details: {
          name: createdKey.name,
          project: projectId ? (showNewProjectInput ? newProject : projects.find(p => p.id === projectId)?.name) : 'Sans projet',
          type: projectType
        },
        ip_address: null,
        user_agent: navigator.userAgent
      });

      onSubmit({ 
        name, 
        key, 
        project: showNewProjectInput ? newProject : projects.find(p => p.id === project)?.name, 
        projectType
      });
      
      setName('');
      setKey('');
      setProject('');
      setProjectType('');
      setNewProject('');
      setShowNewProjectInput(false);
      setValidationResult(null);
      onClose();
      
    } catch (error) {
      console.error('Erreur lors de la création de la clé:', error);
      toast.error('Erreur de création', {
        description: 'Une erreur est survenue lors de la création de la clé API.'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Nouvelle clé API</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom de la clé *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                placeholder="ex: API OpenAI Production"
              />
            </div>

            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valeur de la clé *
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  id="key"
                  value={key}
                  onChange={handleKeyChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    validationResult ? (validationResult.isValid ? 'border-green-500' : 'border-red-500') : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                  placeholder="ex: sk_..."
                />
                {isValidating && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Vérification de la clé...
                  </p>
                )}
                {validationResult && (
                  <p className={`text-sm ${validationResult.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {validationResult.message}
                  </p>
                )}
                {key.startsWith('sk-') && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Les clés OpenAI expirent automatiquement après 3 mois
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Projet
              </label>
              <select
                id="project"
                value={showNewProjectInput ? 'new' : project}
                onChange={handleProjectChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionner un projet</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="new">+ Nouveau projet</option>
              </select>
            </div>

            {showNewProjectInput && (
              <div>
                <label htmlFor="newProject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du nouveau projet *
                </label>
                <input
                  type="text"
                  id="newProject"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required={showNewProjectInput}
                  placeholder="ex: Site e-commerce"
                  minLength={3}
                />
              </div>
            )}

            <div>
              <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type de projet
              </label>
              <select
                id="projectType"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Sélectionner un type</option>
                <option value="production">Production</option>
                <option value="development">Développement</option>
                <option value="staging">Test</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
              disabled={isValidating || (key.startsWith('sk-') && validationResult?.isValid === false)}
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewKeyModal;