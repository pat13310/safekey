import React from 'react';

interface NewProjectsCardProps {
  onNewKey: (projectType?: string) => void;
}

const NewProjectsCard: React.FC<NewProjectsCardProps> = ({ onNewKey }) => {
  return (
    <div className="bg-indigo-700 dark:bg-indigo-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">NOUVEAUX PROJETS</h3>
        
        <div className="space-y-4">
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:bg-indigo-600 p-2 rounded-lg transition-colors"
            onClick={() => onNewKey('Site e-commerce')}
          >
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="text-white text-lg">Site e-commerce</span>
          </div>
          
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:bg-indigo-600 p-2 rounded-lg transition-colors"
            onClick={() => onNewKey('API interne')}
          >
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <span className="text-white text-lg">API interne</span>
          </div>
          
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:bg-indigo-600 p-2 rounded-lg transition-colors"
            onClick={() => onNewKey('Application mobile')}
          >
            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
            <span className="text-white text-lg">Application mobile</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProjectsCard;
