import React, { useState } from 'react';
import { SearchIcon, FilterIcon } from './Icons';

interface SearchFilterProps {
  onSearch: (term: string) => void;
  onFilter: (filters: string[]) => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ onSearch, onFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };
  
  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
  };
  
  const handleFilterChange = (filter: string) => {
    const updatedFilters = selectedFilters.includes(filter)
      ? selectedFilters.filter(f => f !== filter)
      : [...selectedFilters, filter];
    
    setSelectedFilters(updatedFilters);
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
            placeholder="Rechercher..."
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
          <span>Filtrer</span>
        </button>
      </div>
      
      {showFilters && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Filtrer par</h3>
          
          <div className="space-y-2">
            <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mt-3">Projet</div>
            <div className="flex flex-wrap gap-2">
              <FilterChip 
                label="Site e-commerce" 
                selected={selectedFilters.includes('Site e-commerce')}
                onClick={() => handleFilterChange('Site e-commerce')}
              />
              <FilterChip 
                label="API interne" 
                selected={selectedFilters.includes('API interne')}
                onClick={() => handleFilterChange('API interne')}
              />
              <FilterChip 
                label="Application mobile" 
                selected={selectedFilters.includes('Application mobile')}
                onClick={() => handleFilterChange('Application mobile')}
              />
            </div>
            
            <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mt-3">Tags</div>
            <div className="flex flex-wrap gap-2">
              <FilterChip 
                label="database" 
                selected={selectedFilters.includes('database')}
                onClick={() => handleFilterChange('database')}
              />
              <FilterChip 
                label="payment" 
                selected={selectedFilters.includes('payment')}
                onClick={() => handleFilterChange('payment')}
              />
              <FilterChip 
                label="maps" 
                selected={selectedFilters.includes('maps')}
                onClick={() => handleFilterChange('maps')}
              />
              <FilterChip 
                label="production" 
                selected={selectedFilters.includes('production')}
                onClick={() => handleFilterChange('production')}
              />
              <FilterChip 
                label="dev" 
                selected={selectedFilters.includes('dev')}
                onClick={() => handleFilterChange('dev')}
              />
            </div>
            
            <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mt-3">Expiration</div>
            <div className="flex flex-wrap gap-2">
              <FilterChip 
                label="Expirée" 
                selected={selectedFilters.includes('expired')}
                onClick={() => handleFilterChange('expired')}
              />
              <FilterChip 
                label="< 30 jours" 
                selected={selectedFilters.includes('30days')}
                onClick={() => handleFilterChange('30days')}
              />
              <FilterChip 
                label="> 30 jours" 
                selected={selectedFilters.includes('future')}
                onClick={() => handleFilterChange('future')}
              />
            </div>
          </div>
          
          <div className="flex justify-between mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button 
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
              onClick={() => {
                setSelectedFilters([]);
                onFilter([]);
              }}
            >
              Effacer les filtres
            </button>
            <button 
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium"
              onClick={() => setShowFilters(false)}
            >
              Appliquer
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