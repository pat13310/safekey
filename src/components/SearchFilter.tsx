import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { SearchIcon, FilterIcon } from './Icons';
import supabase from '../lib/db';

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface SearchFilterProps {
  onSearch: (term: string) => void;
  onFilter: (filters: string[]) => void;
  onNewKey?: () => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ onSearch, onFilter }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  
  // Charger les projets de l'utilisateur
  useEffect(() => {
    if (user) {
      fetchUserProjects();
    }
  }, [user]);
  
  const fetchUserProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('created_by', user?.id)
        .is('archived_at', null);
        
      if (error) throw error;
      
      if (data) {
        setUserProjects(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };
  
  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
  };
  
  const handleFilterChange = (filter: string) => {
    // Simplification du fonctionnement des filtres
    // Si le filtre est déjà sélectionné, on le désélectionne, sinon on l'ajoute
    const updatedFilters = selectedFilters.includes(filter)
      ? selectedFilters.filter(f => f !== filter)
      : [...selectedFilters, filter];
    
    setSelectedFilters(updatedFilters);
    
    // Application immédiate du filtre sans attendre le bouton "Appliquer"
    onFilter(updatedFilters);
  };
  
  return (
    <div className="relative">
      <div className="flex space-x-2">
        <div className="relative flex-grow">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('dashboard.search')}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500">
            <SearchIcon className="h-5 w-5" />
          </div>
        </div>
        
        <button
          onClick={handleFilterToggle}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center space-x-2"
        >
          <FilterIcon className="h-5 w-5" />
          <span>{t('dashboard.filter')}</span>
        </button>
      </div>
      
      {showFilters && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{t('dashboard.filterBy')}</h3>
          
          <div className="space-y-2">
            <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mt-3">{t('dashboard.projects')}</div>
            <div className="flex flex-wrap gap-2">
              {userProjects.length > 0 ? (
                userProjects.map((project) => (
                  <FilterChip 
                    key={project.id}
                    label={project.name} 
                    selected={selectedFilters.includes(project.name)}
                    onClick={() => handleFilterChange(project.name)}
                  />
                ))
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.noProjects')}</div>
              )}
            </div>
            
            {/* Section des tags supprimée pour simplifier l'interface */}
            
            <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mt-3">{t('dashboard.expiration')}</div>
            <div className="flex flex-wrap gap-2">
              <FilterChip 
                label={t('dashboard.expired')} 
                selected={selectedFilters.includes('expired')}
                onClick={() => handleFilterChange('expired')}
              />
              <FilterChip 
                label={t('dashboard.lessThanThreshold').replace('{days}', settings.expirationThreshold.toString())} 
                selected={selectedFilters.includes('30days')}
                onClick={() => handleFilterChange('30days')}
              />
              <FilterChip 
                label={t('dashboard.moreThanThreshold').replace('{days}', settings.expirationThreshold.toString())} 
                selected={selectedFilters.includes('future')}
                onClick={() => handleFilterChange('future')}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button 
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
              onClick={() => {
                setSelectedFilters([]);
                onFilter([]);
                // Fermer le panneau de filtres après avoir effacé les filtres
                setShowFilters(false);
              }}
            >
              {t('dashboard.clearFilters')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, selected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded-full ${
        selected 
          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );
};

export default SearchFilter;