import React from 'react';
import { KeyIcon } from '../../components/Icons';
import { Shield, Lock, RefreshCw, Eye, Server, FileCheck, Network, Key, UserCheck, AlertTriangle } from 'lucide-react';

const Security = () => {
  const securityFeatures = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Chiffrement de bout en bout",
      description: "Toutes les clés API sont chiffrées avec AES-256 avant d'être stockées."
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Authentification multi-facteurs",
      description: "Protection supplémentaire pour l'accès à votre compte."
    },
    {
      icon: <RefreshCw className="h-6 w-6" />,
      title: "Rotation automatique des clés",
      description: "Renouvellement programmé des clés pour une sécurité optimale."
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Audit complet",
      description: "Journalisation détaillée de toutes les actions sur les clés."
    },
    {
      icon: <Server className="h-6 w-6" />,
      title: "Infrastructure sécurisée",
      description: "Hébergement dans des centres de données certifiés ISO 27001."
    },
    {
      icon: <FileCheck className="h-6 w-6" />,
      title: "Conformité RGPD",
      description: "Respect total des normes européennes de protection des données."
    },
    {
      icon: <Network className="h-6 w-6" />,
      title: "Isolation réseau",
      description: "Séparation stricte des environnements de production."
    },
    {
      icon: <Key className="h-6 w-6" />,
      title: "Gestion des secrets",
      description: "Stockage sécurisé avec HSM pour les clés maîtres."
    },
    {
      icon: <UserCheck className="h-6 w-6" />,
      title: "Contrôle d'accès",
      description: "Permissions granulaires basées sur les rôles (RBAC)."
    },
    {
      icon: <AlertTriangle className="h-6 w-6" />,
      title: "Détection des menaces",
      description: "Surveillance continue des activités suspectes."
    }
  ];

  const certifications = [
    "ISO 27001",
    "SOC 2 Type II",
    "RGPD",
    "HIPAA",
    "PCI DSS"
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-sky-500/10 p-3 rounded-xl">
                <KeyIcon className="h-12 w-12 text-sky-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Sécurité et conformité
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              La sécurité est notre priorité absolue. Découvrez comment nous protégeons vos clés API.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Security Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {securityFeatures.map((feature, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="bg-sky-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-sky-500">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Certifications */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
              Certifications et conformité
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {certifications.map((cert, index) => (
                <div
                  key={index}
                  className="bg-slate-100 dark:bg-slate-700 px-6 py-3 rounded-full text-slate-900 dark:text-white font-medium"
                >
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Security;