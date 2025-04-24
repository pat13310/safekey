import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { queries } from '../lib/db';
import type { ApiKey } from '../lib/db';
import supabase from '../lib/db';
import eventBus from '../utils/eventBus';
import { useLanguage } from '../contexts/LanguageContext';

interface Project {
  id: string;
  name: string;
  key_type?: ApiKey['key_type'];
  environment?: ApiKey['environment'];
}

interface NewKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; key: string; project?: string; projectType: string; clefType: string }) => void;
  initialProjectType?: ApiKey['environment'];
  initialClefType?: ApiKey['key_type'];
}

const NewKeyModal: React.FC<NewKeyModalProps> = ({ isOpen, onClose, onSubmit, initialProjectType, initialClefType }) => {
  const { t } = useLanguage(); // Utiliser la fonction de traduction
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [project, setProject] = useState('');
  const [projectType, setProjectType] = useState(initialProjectType || '');
  const [clefType, setClefType] = useState(initialClefType || '');
  // Langue par défaut : français (fr)
  const [isProjectTypeReadOnly, setIsProjectTypeReadOnly] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; message: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState('');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      // Mettre à jour le type de projet si initialProjectType change
      if (initialProjectType) {
        setProjectType(initialProjectType);
        setClefType(initialClefType || '');
        setIsProjectTypeReadOnly(true);
      } else {
        setIsProjectTypeReadOnly(false);
      }
    }
  }, [isOpen, initialProjectType]);

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
      toast.error(t('newKey.loadingError'));
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
        setValidationResult({ isValid: false, message: t('newKey.invalidKey') });
        toast.error(t('newKey.invalidKey'), {
          description: t('newKey.invalidKeyDesc')
        });
      } else if (response.ok) {
        setValidationResult({ isValid: true, message: t('newKey.validKey') });
        toast.success(t('newKey.validKey'), {
          description: t('newKey.validKeyDesc')
        });
      }
    } catch (error) {
      setValidationResult({ isValid: false, message: t('newKey.validationError') });
      toast.error(t('newKey.validationError'), {
        description: t('newKey.validationErrorDesc')
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
      setIsProjectTypeReadOnly(false);
      setProjectType('');
    } else {
      setShowNewProjectInput(false);
      setProject(value);
      
      // Définir le type de projet par défaut à 'production'
      setProjectType('production');
      setIsProjectTypeReadOnly(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Vérifier si une clé avec le même nom existe déjà
      const { data: existingKey } = await supabase
        .from('api_keys')
        .select('id')
        .eq('name', name)
        .maybeSingle();
        
      if (existingKey) {
        toast.warning('Nom de clé déjà utilisé', {
          description: `Une clé avec le nom "${name}" existe déjà. Veuillez utiliser un nom différent.`
        });
        return;
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
        key_type: clefType as 'Site e-commerce' | 'API interne' | 'Application mobile',
        provider: key.startsWith('sk-') ? 'openai' : null,
        environment: projectType as 'development' | 'staging' | 'production'
        // La propriété 'language' a été supprimée car elle n'existe pas dans la table api_keys
      };

      const createdKey = await queries.createApiKey(newApiKey);

      await queries.addKeyHistory({
        api_key_id: createdKey.id,
        action: 'created',
        performed_by: user.id,
        details: {
          name: createdKey.name,
          project: projectId ? (showNewProjectInput ? newProject : projects.find(p => p.id === projectId)?.name) : t('newKey.noProject'),
          type: projectType
        },
        ip_address: null,
        user_agent: navigator.userAgent
      });
      
      // Émettre un événement pour informer les autres composants
      console.log('Émission de l\'événement key_updated');
      eventBus.emit('key_updated');

      onSubmit({ 
        name, 
        key, 
        project: showNewProjectInput ? newProject : projects.find(p => p.id === project)?.name, 
        projectType,
        clefType
      });
      
      setName('');
      setKey('');
      setProject('');
      setProjectType('');
      setClefType('');
      setNewProject('');
      setShowNewProjectInput(false);
      setValidationResult(null);
      onClose();
      
    } catch (error: any) {
      console.error('Erreur lors de la création de la clé:', error);
      
      // Vérifier si l'erreur est due à une clé dupliquée
      if (error.code === '23505' && error.message?.includes('api_keys_name_key')) {
        toast.warning('Nom de clé déjà utilisé', {
          description: `Une clé avec le nom "${name}" existe déjà. Veuillez utiliser un nom différent.`
        });
      } else {
        toast.error(t('newKey.createError'), {
          description: t('newKey.createErrorDesc')
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t('newKey.title')}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('newKey.name')}
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                placeholder={t('newKey.namePlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('newKey.value')}
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
                  placeholder={t('newKey.valuePlaceholder')}
                />
                {isValidating && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('newKey.validating')}
                  </p>
                )}
                {validationResult && (
                  <p className={`text-sm ${validationResult.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {validationResult.message}
                  </p>
                )}
                {key.startsWith('sk-') && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('newKey.openaiExpiration')}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('newKey.project')}
              </label>
              <select
                id="project"
                value={showNewProjectInput ? 'new' : project}
                onChange={handleProjectChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{t('newKey.selectProject')}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="new">{t('newKey.newProject')}</option>
              </select>
            </div>

            {showNewProjectInput && (
              <div>
                <label htmlFor="newProject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('newKey.newProjectName')}
                </label>
                <input
                  type="text"
                  id="newProject"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required={showNewProjectInput}
                  placeholder={t('newKey.newProjectPlaceholder')}
                  minLength={3}
                />
              </div>
            )}

            <div>
              <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('newKey.environment')}
              </label>
              <select
                id="projectType"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${isProjectTypeReadOnly ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'} text-gray-900 dark:text-white`}
                required
                disabled={isProjectTypeReadOnly}
              >
                <option value="">{t('newKey.selectEnvironment')}</option>
                <option value="production">{t('newKey.production')}</option>
                <option value="development">{t('newKey.development')}</option>
                <option value="staging">{t('newKey.staging')}</option>
              </select>
              {isProjectTypeReadOnly && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('newKey.environmentReadOnly')}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="clefType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('newKey.category')}
              </label>
              <select
                id="clefType"
                value={clefType}
                onChange={(e) => setClefType(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${isProjectTypeReadOnly ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'} text-gray-900 dark:text-white`}
                required
              >
                <option value="">{t('newKey.selectCategory')}</option>
                <option value="Site e-commerce">{t('newKey.ecommerce')}</option>
                <option value="API interne">{t('newKey.internalApi')}</option>
                <option value="Application mobile">{t('newKey.mobileApp')}</option>
                <option value="Divers">{t('newKey.misc')}</option>
              </select>
            </div>
            

          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {t('newKey.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
              disabled={isValidating || (key.startsWith('sk-') && validationResult?.isValid === false)}
            >
              {t('newKey.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewKeyModal;