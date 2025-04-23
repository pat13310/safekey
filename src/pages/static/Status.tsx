import React from 'react';
import { KeyIcon } from '../../components/Icons';
import { CheckCircle, AlertTriangle, Clock, Activity } from 'lucide-react';

const Status = () => {
  const services = [
    {
      name: "API",
      status: "operational",
      uptime: "99.99%",
      lastIncident: "Aucun incident"
    },
    {
      name: "Dashboard",
      status: "operational",
      uptime: "99.98%",
      lastIncident: "Il y a 15 jours"
    },
    {
      name: "Base de données",
      status: "operational",
      uptime: "99.99%",
      lastIncident: "Aucun incident"
    },
    {
      name: "Authentification",
      status: "operational",
      uptime: "100%",
      lastIncident: "Aucun incident"
    }
  ];

  const incidents = [
    {
      date: "2024-03-15",
      title: "Latence API élevée",
      status: "resolved",
      duration: "23 minutes",
      description: "Une latence élevée a été observée sur notre API. Le problème a été résolu."
    },
    {
      date: "2024-02-28",
      title: "Maintenance planifiée",
      status: "completed",
      duration: "45 minutes",
      description: "Mise à jour de sécurité et maintenance planifiée."
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case "down":
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "degraded":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "down":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
    }
  };

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
              État du système
            </h1>
            <div className="flex items-center justify-center space-x-2 text-xl text-slate-400">
              <Activity className="h-6 w-6 text-green-500" />
              <span>Tous les systèmes sont opérationnels</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Services Status */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Services
            </h2>
            <div className="grid gap-6">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(service.status)}
                      <div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                          {service.name}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400">
                          Uptime: {service.uptime}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                        Opérationnel
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incident History */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Historique des incidents
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {incidents.map((incident, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                          {incident.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {incident.date} • Durée: {incident.duration}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        incident.status === 'resolved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {incident.status === 'resolved' ? 'Résolu' : 'Terminé'}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      {incident.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Status;