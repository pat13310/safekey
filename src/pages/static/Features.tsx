import React from 'react';
import { KeyIcon } from '../../components/Icons';
import { Shield, Lock, RefreshCw, LineChart, Zap, Globe, Users, Bell, Terminal, Database } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Sécurité de niveau entreprise",
      description: "Chiffrement de bout en bout, authentification multi-facteurs et journalisation complète des accès."
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Contrôle d'accès granulaire",
      description: "Définissez des permissions précises par utilisateur, équipe et projet."
    },
    {
      icon: <RefreshCw className="h-6 w-6" />,
      title: "Rotation automatique des clés",
      description: "Planifiez le renouvellement automatique de vos clés pour une sécurité optimale."
    },
    {
      icon: <LineChart className="h-6 w-6" />,
      title: "Monitoring en temps réel",
      description: "Suivez l'utilisation de vos clés et recevez des alertes en cas d'activité suspecte."
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Multi-environnements",
      description: "Gérez facilement vos clés à travers différents environnements (dev, staging, prod)."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Collaboration d'équipe",
      description: "Partagez et gérez les accès aux clés API au sein de votre organisation."
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Alertes et notifications",
      description: "Soyez informé des événements importants concernant vos clés API."
    },
    {
      icon: <Terminal className="h-6 w-6" />,
      title: "API complète",
      description: "Intégrez SafeKey à vos outils existants via notre API RESTful."
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "Sauvegarde sécurisée",
      description: "Vos clés sont sauvegardées de manière sécurisée avec redondance géographique."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Performance optimale",
      description: "Architecture distribuée pour des temps de réponse minimaux."
    }
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
              Fonctionnalités
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Découvrez comment SafeKey vous aide à gérer vos clés API de manière sécurisée et efficace.
            </p>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
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
        </div>
      </main>
    </div>
  );
};

export default Features;