// Suppression de l'import useState car il n'est pas utilisé
import {
  HomeIcon,
  FolderIcon,
  HistoryIcon,
  SettingsIcon,
  KeyIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from './Icons';
// Pas besoin de la modale de détails du projet
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Moon, Sun, LogOut } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  onNewKey: (projectType?: string) => void;
  onNavigate: (page: 'dashboard' | 'projects' | 'history' | 'settings' | 'features' | 'pricing' | 'security' | 'about' | 'contact' | 'status') => void;
  currentPage: 'dashboard' | 'projects' | 'history' | 'settings' | 'features' | 'pricing' | 'security' | 'about' | 'contact' | 'status';
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
  onClick: (projectType: string) => void;
}> = ({ project, isOpen, onClick }) => {
  return (
    <li
      onClick={() => {
        onClick(project.name);
      }}
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
  const { t } = useLanguage(); // Utiliser la fonction de traduction
  // Suppression des états pour la modale de détails du projet

  const getProjectName = (key: string): string => {
    return t(`sidebar.${key}`);
  };

  const recentProjects: RecentProject[] = [
    {
      name: getProjectName('projectEcommerce'),
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
      name: getProjectName('projectInternalApi'),
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
      name: getProjectName('projectMobileApp'),
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

  // Le clic sur un projet ouvre directement le formulaire de nouvelle clé

  return (
    <>
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
            onClick={() => onNewKey()}
            className={`w-full bg-black/20 hover:bg-black/30 text-white py-2.5 rounded-md transition-colors duration-200 flex items-center text-sm font-medium ${
              isOpen ? 'px-4 justify-start' : 'justify-center'
            }`}
          >
            <span className={`${isOpen ? 'mr-2' : ''} text-lg leading-none`}>
              +
            </span>
            {isOpen && <span>{t('sidebar.newKey')}</span>}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <ul className="px-2">
            <NavItem
              icon={<HomeIcon className="h-5 w-5" />}
              text={t('sidebar.dashboard')}
              active={currentPage === 'dashboard'}
              isOpen={isOpen}
              onClick={() => onNavigate('dashboard')}
            />
            <NavItem
              icon={<FolderIcon className="h-5 w-5" />}
              text={t('sidebar.projects')}
              active={currentPage === 'projects'}
              isOpen={isOpen}
              onClick={() => onNavigate('projects')}
            />
            <NavItem
              icon={<HistoryIcon className="h-5 w-5" />}
              text={t('sidebar.history')}
              active={currentPage === 'history'}
              isOpen={isOpen}
              onClick={() => onNavigate('history')}
            />
            <NavItem
              icon={<SettingsIcon className="h-5 w-5" />}
              text={t('sidebar.settings')}
              active={currentPage === 'settings'}
              isOpen={isOpen}
              onClick={() => onNavigate('settings')}
            />
          </ul>

          {isOpen && (
            <>
              <div className="mt-8 mb-2 px-4">
                <h3 className="text-xs font-semibold text-indigo-600 dark:text-indigo-200 uppercase tracking-wider">
                  {t('sidebar.recentProjects')}
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
                onClick={() => onNewKey(project.name)}

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
                <span>{t('sidebar.logout')}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                {user.email?.[0].toUpperCase()}
              </div>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-full hover:bg-indigo-400 transition-colors duration-200"
                title={theme === 'dark' ? t('sidebar.lightMode') : t('sidebar.darkMode')}
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
      </div>

      {/* Suppression de la modale de détails du projet */}
    </>
  );
};

export default Sidebar;
