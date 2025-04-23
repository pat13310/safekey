import React from 'react';
import { KeyIcon } from '../../components/Icons';
import { Users, Target, Heart, Globe } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Sécurité avant tout",
      description: "La protection de vos données est notre priorité absolue. Nous appliquons les meilleures pratiques de sécurité."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Centrés sur l'utilisateur",
      description: "Nous créons des solutions intuitives qui répondent aux besoins réels de nos utilisateurs."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Innovation continue",
      description: "Nous innovons constamment pour vous offrir les meilleures solutions de gestion de clés API."
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Qualité premium",
      description: "Nous nous engageons à fournir un service de la plus haute qualité à nos clients."
    }
  ];

  const team = [
    {
      name: "Sophie Martin",
      role: "CEO & Co-fondatrice",
      image: "https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=300"
    },
    {
      name: "Thomas Dubois",
      role: "CTO",
      image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300"
    },
    {
      name: "Julie Bernard",
      role: "Head of Security",
      image: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=300"
    },
    {
      name: "Alexandre Chen",
      role: "Lead Developer",
      image: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=300"
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
              À propos de SafeKey
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Notre mission est de rendre la gestion des clés API simple et sécurisée pour tous.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Story Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 text-center">
              Notre Histoire
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm">
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-6">
                SafeKey est né d'un constat simple : la gestion des clés API est devenue un enjeu crucial pour les entreprises modernes, mais les solutions existantes étaient soit trop complexes, soit insuffisamment sécurisées.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                Fondée en 2024, notre entreprise s'est donnée pour mission de résoudre ce défi en créant une plateforme qui allie sécurité de niveau entreprise et simplicité d'utilisation.
              </p>
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 text-center">
              Nos Valeurs
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm text-center"
                >
                  <div className="bg-sky-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <div className="text-sky-500">
                      {value.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Section */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 text-center">
              Notre Équipe
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm text-center"
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    {member.name}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;