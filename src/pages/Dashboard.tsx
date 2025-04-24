import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import KeyTable, { KeyData } from '../components/KeyTable';
import SearchFilter from '../components/SearchFilter';
import {
  EyeIcon,
  EyeOffIcon, 
  KeyIcon, 
  FolderIcon, 
  AlertIcon,
  HomeIcon
} from '../components/Icons';
import NewKeyModal from '../components/NewKeyModal';
import PageTitle from '../components/PageTitle';
import supabase from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import eventBus from '../utils/eventBus';

interface DashboardProps {
  onNewKey: () => void;
  onNavigate: (page: 'dashboard' | 'projects' | 'history' | 'settings') => void;
}

// Interface pour les données brutes des clés API reçues de la base de données
interface ApiKeyResponse {
  id: string;
  name: string;
  key_value: string;
  project_id: string;
  expires_at: string | null;
  provider: string | null;
  environment: string;
  is_active: boolean;
  project: {
    name: string;
  }[] | null;
}

const Dashboard: React.FC<DashboardProps> = ({ onNewKey, onNavigate }) => {
  const [keys, setKeys] = useState<KeyData[]>([]);
  const [filteredKeys, setFilteredKeys] = useState<KeyData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [projectCount, setProjectCount] = useState(0);
  const keysPerPage = 8;
  const { user } = useAuth();
  const { t } = useLanguage();
  const { settings } = useSettings(); // Utiliser la fonction de traduction

  useEffect(() => {
    if (user) {
      fetchApiKeys();
      fetchProjectCount();
    }
  }, [user]);

  // Écouter les événements de mise à jour des clés
  useEffect(() => {
    // Fonction de rappel pour recharger les données
    const handleKeyUpdated = () => {
      console.log('Événement de mise à jour des clés reçu dans Dashboard');
      fetchApiKeys();
      fetchProjectCount();
    };
    
    // S'abonner à l'événement
    eventBus.on('key_updated', handleKeyUpdated);
    
    // Se désabonner lors du démontage du composant
    return () => {
      eventBus.off('key_updated', handleKeyUpdated);
    };
  }, []);

  const fetchProjectCount = async () => {
    try {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .eq('created_by', user?.id)
        .is('archived_at', null);

      if (error) throw error;
      setProjectCount(count || 0);
    } catch (error) {
      console.error('Error fetching project count:', error);
    }
  };

  const fetchApiKeys = async () => {
    try {
      // Récupérer d'abord tous les projets
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('created_by', user?.id)
        .is('archived_at', null);
        
      if (projectsError) {
        throw projectsError;
      }
      
      // Ensuite récupérer les clés API
      const { data: apiKeys, error } = await supabase
        .from('api_keys')
        .select(`
          id,
          name,
          key_value,
          project_id,
          expires_at,
          provider,
          environment,
          is_active
        `)
        .eq('created_by', user?.id)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      const formattedKeys: KeyData[] = (apiKeys as ApiKeyResponse[]).map(key => {
        // Trouver le projet correspondant à la clé
        const projectName = projects && projects.length > 0
          ? projects.find(p => p.id === key.project_id)?.name || t('dashboard.defaultProject')
          : t('dashboard.defaultProject');
          
        return {
          id: key.id,
          name: key.name,
          key: key.key_value,
          project: projectName,
          project_id: key.project_id,
          expirationDate: key.expires_at ? 
            new Date(key.expires_at).toLocaleDateString('fr-FR') : 
            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
          provider: key.provider,
          environment: key.environment,
          isActive: key.is_active
        };
      });

      setKeys(formattedKeys);
      setFilteredKeys(formattedKeys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(term, activeFilters);
    setCurrentPage(1);
  };

  const handleFilter = (filters: string[]) => {
    setActiveFilters(filters);
    applyFilters(searchTerm, filters);
    setCurrentPage(1);
  };

  const handleDeleteKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Refresh the keys list
      await fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const applyFilters = (term: string, filters: string[]) => {
    let result = keys;
    
    if (term) {
      const lowerCaseTerm = term.toLowerCase();
      result = result.filter(key => 
        key.name.toLowerCase().includes(lowerCaseTerm) ||
        key.project.toLowerCase().includes(lowerCaseTerm) ||
        (key.provider && key.provider.toLowerCase().includes(lowerCaseTerm))
      );
    }
    
    if (filters.length > 0) {
      result = result.filter(key => {
        const projectMatch = filters.includes(key.project);
        
        const today = new Date();
        const expirationDate = new Date(key.expirationDate.split('/').reverse().join('-'));
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Utiliser le seuil d'expiration configuré par l'utilisateur
        const threshold = settings.expirationThreshold;
        
        const expiredMatch = filters.includes('expired') && daysUntilExpiration <= 0;
        const thresholdMatch = filters.includes('30days') && daysUntilExpiration > 0 && daysUntilExpiration <= threshold;
        const futureMatch = filters.includes('future') && daysUntilExpiration > threshold;
        
        return projectMatch || expiredMatch || thresholdMatch || futureMatch;
      });
    }
    
    setFilteredKeys(result);
  };

  const indexOfLastKey = currentPage * keysPerPage;
  const indexOfFirstKey = indexOfLastKey - keysPerPage;
  const currentKeys = filteredKeys.slice(indexOfFirstKey, indexOfLastKey);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const activeKeysCount = keys.filter(key => {
    const expirationDate = new Date(key.expirationDate.split('/').reverse().join('-'));
    return expirationDate > new Date();
  }).length;
  
  const expiredKeysCount = keys.length - activeKeysCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3">{t('dashboard.loadingKeys')}</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <PageTitle 
        title={t('dashboard.title')} 
        icon={<HomeIcon className="h-6 w-6" />}
        actions={
          <button 
            onClick={onNewKey}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg"
          >
            + {t('dashboard.addNewKey')}
          </button>
        } 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title={t('dashboard.activeKeys')} 
          value={activeKeysCount}
          icon={<KeyIcon className="h-6 w-6 text-white" />}
          bgColor="bg-indigo-600"
        />
        <div onClick={() => onNavigate('projects')} className="cursor-pointer">
          <StatCard 
            title={t('dashboard.projects')} 
            value={projectCount}
            icon={<FolderIcon className="h-6 w-6 text-white" />}
            bgColor="bg-green-600"
          />
        </div>
        <StatCard 
          title={t('dashboard.expiringSoon')} 
          value={expiredKeysCount}
          icon={<AlertIcon className="h-6 w-6 text-white" />}
          bgColor="bg-red-600"
        />
      </div>
      
      <div className="mb-6">
        <SearchFilter 
          onSearch={handleSearch}
          onFilter={handleFilter}
          onNewKey={onNewKey}
        />
      </div>
      
      <KeyTable 
        keys={currentKeys}
        currentPage={currentPage}
        totalKeys={filteredKeys.length}
        keysPerPage={keysPerPage}
        onPageChange={handlePageChange}
        onDeleteKey={handleDeleteKey}
        onUpdate={fetchApiKeys}
      />
    </div>
  );
};

export default Dashboard;