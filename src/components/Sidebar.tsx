import React, { useState } from 'react';
import {
  HomeIcon,
  FolderIcon,
  HistoryIcon,
  SettingsIcon,
  KeyIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from './Icons';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, LogOut } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  onNewKey: () => void;
  onNavigate: (page: 'dashboard' | 'projects' | 'history' | 'settings') => void;
  currentPage: 'dashboard' | 'projects' | 'history' | 'settings';
  user: User;
  onSignOut: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
  isOpen: boolean;
}

interface RecentProject {
  name: string;
  color: string;
  types: ProjectType[];
}

interface ProjectType {
  name: string;
  environment: string;
  keyCount: number;
  lastModified: string;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  text,
  active = false,
  onClick,
  isOpen,
}) => {
  return (
    <li
      className={`flex items-center px-4 py-2 my-1 rounded-md cursor-pointer transition-colors duration-200
        ${
          active
            ? 'bg-indigo-600 text-white'
            : 'text-gray-300 hover:bg-indigo-500/50 hover:text-white'
        }
        ${!isOpen ? 'justify-center' : ''}`}
      onClick={onClick}
    >
      <span className={isOpen ? 'mr-3' : ''}>{icon}</span>
      {isOpen && <span>{text}</span>}
    </li>
  );
};

const RecentProjectItem: React.FC<{
  project: RecentProject;
  isOpen: boolean;
  onClick: () => void;
}> = ({ project, isOpen, onClick }) => {
  return (
    <li
      onClick={onClick}
      className={`flex items-center px-4 py-2 rounded-md cursor-pointer hover:bg-indigo-500/50 text-gray-300 hover:text-white transition-colors duration-200 ${
        !isOpen ? 'justify-center' : ''
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${isOpen ? 'mr-3' : ''} ${
          project.color
        }`}
      ></span>
      {isOpen && <span>{project.name}</span>}
    </li>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  onNewKey,
  onNavigate,
  currentPage,
  user,
  onSignOut,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [selectedProject, setSelectedProject] = useState<RecentProject | null>(
    null
  );
  const [showProjectTypes, setShowProjectTypes] = useState(false);

  const recentProjects: RecentProject[] = [
    {
      name: 'Site e-commerce',
      color: 'bg-green-500',
      types: [
        {
          name: 'API Principale',
          environment: 'Production',
          keyCount: 3,
          lastModified: '2024-03-15',
        },
        {
          name: 'API Paiement',
          environment: 'Production',
          keyCount: 2,
          lastModified: '2024-03-14',
        },
        {
          name: 'API Test',
          environment: 'Développement',
          keyCount: 1,
          lastModified: '2024-03-13',
        },
      ],
    },
    {
      name: 'API interne',
      color: 'bg-blue-500',
      types: [
        {
          name: 'API Auth',
          environment: 'Production',
          keyCount: 2,
          lastModified: '2024-03-15',
        },
        {
          name: 'API Data',
          environment: 'Staging',
          keyCount: 1,
          lastModified: '2024-03-12',
        },
      ],
    },
    {
      name: 'Application mobile',
      color: 'bg-purple-500',
      types: [
        {
          name: 'API Mobile',
          environment: 'Production',
          keyCount: 2,
          lastModified: '2024-03-14',
        },
        {
          name: 'API Test',
          environment: 'Test',
          keyCount: 1,
          lastModified: '2024-03-11',
        },
      ],
    },
  ];

  const handleProjectClick = (project: RecentProject) => {
    setSelectedProject(project);
    setShowProjectTypes(true);
  };

  return (
    <div
      className={`bg-indigo-800 text-white transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'w-60' : 'w-16'}`}
    >
      <div className="flex items-center p-4 border-b border-indigo-700">
        <KeyIcon className={`h-6 w-6 ${isOpen ? 'mr-2' : ''}`} />
        {isOpen && <span className="text-xl font-bold">SafeKey</span>}
        <button
          onClick={toggleSidebar}
          className={`p-1 rounded-full hover:bg-indigo-500/50 transition-colors duration-200 ${
            isOpen ? 'ml-auto' : 'ml-0 mt-2'
          }`}
        >
          {isOpen ? (
            <ChevronLeftIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="my-4 px-4">
        <button
          onClick={onNewKey}
          className={`w-full bg-black/20 hover:bg-black/30 text-white py-2.5 rounded-md transition-colors duration-200 flex items-center text-sm font-medium ${
            isOpen ? 'px-4 justify-start' : 'justify-center'
          }`}
        >
          <span className={`${isOpen ? 'mr-2' : ''} text-lg leading-none`}>
            +
          </span>
          {isOpen && <span>Nouvelle clé</span>}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="px-2">
          <NavItem
            icon={<HomeIcon className="h-5 w-5" />}
            text="Tableau de bord"
            active={currentPage === 'dashboard'}
            isOpen={isOpen}
            onClick={() => onNavigate('dashboard')}
          />
          <NavItem
            icon={<FolderIcon className="h-5 w-5" />}
            text="Mes projets"
            active={currentPage === 'projects'}
            isOpen={isOpen}
            onClick={() => onNavigate('projects')}
          />
          <NavItem
            icon={<HistoryIcon className="h-5 w-5" />}
            text="Historique"
            active={currentPage === 'history'}
            isOpen={isOpen}
            onClick={() => onNavigate('history')}
          />
          <NavItem
            icon={<SettingsIcon className="h-5 w-5" />}
            text="Paramètres"
            active={currentPage === 'settings'}
            isOpen={isOpen}
            onClick={() => onNavigate('settings')}
          />
        </ul>

        {isOpen && (
          <>
            <div className="mt-8 mb-2 px-4">
              <h3 className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                NOUVEAUX PROJETS
              </h3>
            </div>
          </>
        )}
        <ul className="px-2">
          {recentProjects.map((project, index) => (
            <RecentProjectItem
              key={index}
              project={project}
              isOpen={isOpen}
              onClick={() => handleProjectClick(project)}
            />
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-indigo-700">
        {isOpen ? (
          <div className="flex flex-col space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="ml-2 flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-full hover:bg-indigo-400 transition-colors duration-200"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-600/10 rounded-md transition-colors duration-200"
            >
              <LogOut size={16} />
              <span>Déconnexion</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              {user.email?.[0].toUpperCase()}
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full hover:bg-indigo-500/50s transition-colors duration-200"
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={onSignOut}
              className="p-1.5 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-full transition-colors duration-200"
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      {showProjectTypes && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${selectedProject.color}`}
                ></div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedProject.name}
                </h2>
              </div>
              <button
                onClick={() => setShowProjectTypes(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Environnement
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Clés
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Dernière modification
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedProject.types.map((type, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {type.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            type.environment === 'Production'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : type.environment === 'Staging'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}
                        >
                          {type.environment}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {type.keyCount} clé{type.keyCount > 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {type.lastModified}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <button
                          onClick={onNewKey}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium"
                        >
                          + Nouvelle clé
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
