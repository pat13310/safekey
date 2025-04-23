import React from 'react';
import { KeyIcon } from '../../components/Icons';
import { Check } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: "Gratuit",
      price: "0€",
      period: "par mois",
      description: "Parfait pour démarrer",
      features: [
        "Jusqu'à 5 clés API",
        "1 projet",
        "Historique 30 jours",
        "Support communautaire"
      ],
      cta: "Commencer gratuitement",
      highlighted: false
    },
    {
      name: "Pro",
      price: "19€",
      period: "par mois",
      description: "Pour les équipes en croissance",
      features: [
        "Clés API illimitées",
        "Projets illimités",
        "Historique 1 an",
        "Support prioritaire",
        "Rotation automatique",
        "Contrôle d'accès avancé"
      ],
      cta: "Essai gratuit de 14 jours",
      highlighted: true
    },
    {
      name: "Entreprise",
      price: "Sur mesure",
      period: "",
      description: "Pour les grandes organisations",
      features: [
        "Tout dans Pro",
        "Support dédié",
        "SLA garanti",
        "SSO & SCIM",
        "Audit avancé",
        "Formation personnalisée"
      ],
      cta: "Contacter les ventes",
      highlighted: false
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
              Tarifs simples et transparents
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Choisissez le plan qui correspond à vos besoins. Pas de surprise, pas de frais cachés.
            </p>
          </div>
        </div>
      </header>

      {/* Pricing Grid */}
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`
                  rounded-2xl p-8
                  ${plan.highlighted 
                    ? 'bg-slate-900 text-white ring-2 ring-sky-500' 
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'}
                `}
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="ml-2 text-slate-400">{plan.period}</span>
                  )}
                </div>
                <p className={`
                  text-sm mb-6
                  ${plan.highlighted ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}
                `}>
                  {plan.description}
                </p>
                <button
                  className={`
                    w-full py-3 px-6 rounded-xl font-medium mb-8 transition-colors
                    ${plan.highlighted
                      ? 'bg-sky-500 hover:bg-sky-600 text-white'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'}
                  `}
                >
                  {plan.cta}
                </button>
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className={`
                        h-5 w-5 mr-3 flex-shrink-0
                        ${plan.highlighted ? 'text-sky-400' : 'text-sky-500'}
                      `} />
                      <span className={
                        plan.highlighted ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'
                      }>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;