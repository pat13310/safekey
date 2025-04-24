import React, { ReactNode } from 'react';

interface PageTitleProps {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

/**
 * Composant réutilisable pour les titres de page avec icône
 */
const PageTitle: React.FC<PageTitleProps> = ({ title, icon, actions }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center">
        {icon && <div className="mr-3 text-indigo-600 dark:text-indigo-400">{icon}</div>}
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
      </div>
      {actions && <div className="flex space-x-2">{actions}</div>}
    </div>
  );
};

export default PageTitle;
