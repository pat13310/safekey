import React from 'react';
import { X } from 'lucide-react';

interface ProjectType {
  name: string;
  environment: string;
  keyCount: number;
  lastModified: string;
}

interface ProjectDetailsModalProps {
  project: {
    name: string;
    color: string;
    types: ProjectType[];
  };
  onClose: () => void;
  onNewKey: () => void;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  onClose,
  onNewKey,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-lg overflow-hidden w-full max-w-4xl mx-4">
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${project.color}`}></div>
            <h2 className="text-xl font-semibold">{project.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-400 mb-2 px-4">
            <div className="col-span-1">TYPE</div>
            <div className="col-span-1">ENVIRONNEMENT</div>
            <div className="col-span-1">CLÉS</div>
            <div className="col-span-1">DERNIÈRE MODIFICATION</div>
            <div className="col-span-1 text-right">ACTIONS</div>
          </div>
          
          <div className="space-y-4">
            {project.types.map((type, index) => (
              <div 
                key={index} 
                className="grid grid-cols-5 gap-4 items-center px-4 py-3 border-b border-gray-800"
              >
                <div className="col-span-1 font-medium">{type.name}</div>
                <div className="col-span-1">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    type.environment === 'Production' 
                      ? 'bg-green-900 text-green-300' 
                      : type.environment === 'Staging'
                      ? 'bg-yellow-900 text-yellow-300'
                      : 'bg-blue-900 text-blue-300'
                  }`}>
                    {type.environment}
                  </span>
                </div>
                <div className="col-span-1">
                  {type.keyCount} clé{type.keyCount > 1 ? 's' : ''}
                </div>
                <div className="col-span-1 text-gray-500">{type.lastModified}</div>
                <div className="col-span-1 text-right">
                  <button
                    onClick={onNewKey}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    + Nouvelle clé
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;
