import React from 'react';
import { KeyIcon } from './Icons';
import { Shield, Key, Lock, RefreshCw, History, Users, ChevronRight, Globe, Zap, LineChart } from 'lucide-react';

interface FooterLink {
  title: string;
  links: Array<{
    name: string;
    href: string;
    onClick?: () => void;
  }>;
}

const Landing: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const footerSections: FooterLink[] = [
    {
      title: "Produit",
      links: [
        { name: "Fonctionnalités", href: "#", onClick: () => onGetStarted() },
        { name: "Tarifs", href: "#", onClick: () => onGetStarted() },
        { name: "Sécurité", href: "#", onClick: () => onGetStarted() }
      ]
    },
    {
      title: "Ressources",
      links: [
        { name: "Documentation", href: "https://docs.safekey.com" },
        { name: "API Reference", href: "https://api.safekey.com" },
        { name: "Guides", href: "https://guides.safekey.com" }
      ]
    },
    {
      title: "Entreprise",
      links: [
        { name: "À propos", href: "#", onClick: () => onGetStarted() },
        { name: "Blog", href: "https://blog.safekey.com" },
        { name: "Carrières", href: "https://careers.safekey.com" }
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Centre d'aide", href: "https://help.safekey.com" },
        { name: "Contact", href: "#", onClick: () => onGetStarted() },
        { name: "Status", href: "#", onClick: () => onGetStarted() }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 relative">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'grayscale(100%)'
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 to-slate-800/80" />

      {/* Header */}
      <header className="relative px-6 py-4">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-800/80 p-2 rounded-lg backdrop-blur-sm">
              <KeyIcon className="h-8 w-8 text-slate-200" />
            </div>
            <span className="text-2xl font-bold text-slate-200">SafeKey</span>
          </div>
          <button
            onClick={onGetStarted}
            className="bg-slate-800/80 backdrop-blur-sm text-slate-200 px-6 py-2.5 rounded-lg font-medium hover:bg-slate-700/80 transition-colors flex items-center space-x-2"
          >
            <span>Se connecter</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Hero content */}
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8 inline-flex items-center space-x-2 bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full text-slate-300">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Sécurité de niveau entreprise</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-200 mb-8 leading-tight">
              Gérez vos clés API en toute{' '}
              <span className="text-sky-400">
                sécurité
              </span>
            </h1>
            <p className="text-lg text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Une solution professionnelle pour stocker, gérer et surveiller vos clés API.
              Conçue pour les équipes qui exigent sécurité et simplicité.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto bg-sky-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-sky-600 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Commencer gratuitement</span>
                <ChevronRight className="h-5 w-5" />
              </button>
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto bg-slate-800/80 backdrop-blur-sm text-slate-200 px-8 py-3 rounded-lg font-medium hover:bg-slate-700/80 transition-colors"
              >
                Voir la démo
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-200 mb-2">10k+</div>
              <div className="text-slate-400 text-sm">Clés gérées</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-200 mb-2">99.9%</div>
              <div className="text-slate-400 text-sm">Disponibilité</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-200 mb-2">2k+</div>
              <div className="text-slate-400 text-sm">Utilisateurs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-200 mb-2">24/7</div>
              <div className="text-slate-400 text-sm">Support</div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-200 mb-4">
              Une solution complète pour vos clés API
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Des outils professionnels pour gérer efficacement vos clés API
              tout en garantissant une sécurité optimale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Sécurité renforcée",
                description: "Stockage sécurisé avec chiffrement de bout en bout et contrôle d'accès granulaire."
              },
              {
                icon: <Globe className="h-6 w-6" />,
                title: "Multi-environnements",
                description: "Gérez vos clés à travers différents environnements de développement."
              },
              {
                icon: <Lock className="h-6 w-6" />,
                title: "Contrôle d'accès",
                description: "Définissez des permissions précises pour chaque membre de votre équipe."
              },
              {
                icon: <RefreshCw className="h-6 w-6" />,
                title: "Rotation automatique",
                description: "Planifiez la rotation automatique de vos clés pour plus de sécurité."
              },
              {
                icon: <LineChart className="h-6 w-6" />,
                title: "Monitoring avancé",
                description: "Suivez l'utilisation de vos clés en temps réel avec des alertes."
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Intégration facile",
                description: "Intégrez SafeKey à votre stack technique en quelques minutes."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-6 hover:bg-slate-700/80 transition-colors">
                <div className="bg-sky-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-sky-400">{feature.icon}</div>
                </div>
                <h3 className="text-lg font-medium text-slate-200 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-200 mb-4">
              Prêt à sécuriser vos clés API ?
            </h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Rejoignez les entreprises qui font confiance à SafeKey pour la gestion de leurs clés API.
            </p>
            <button
              onClick={onGetStarted}
              className="bg-sky-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-sky-600 transition-colors inline-flex items-center space-x-2"
            >
              <span>Commencer maintenant</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {footerSections.map((section, index) => (
              <div key={index}>
                <h3 className="text-slate-200 font-medium mb-3">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href={link.href}
                        onClick={link.onClick}
                        className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="bg-slate-800/80 backdrop-blur-sm p-2 rounded-lg">
                <KeyIcon className="h-6 w-6 text-slate-200" />
              </div>
              <span className="text-slate-200 font-medium">SafeKey</span>
            </div>
            <div className="text-slate-400 text-sm">
              © 2024 SafeKey. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;