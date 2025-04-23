import React, { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import supabase from '../lib/db';
import { toast } from 'sonner';
import { KeyIcon } from './Icons';
import { Shield, ChevronRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'sign_in' | 'sign_up';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode = 'sign_in' }) => {
  const [view, setView] = useState<'sign_in' | 'sign_up'>(mode);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'demo@example.com',
        password: 'demo@2025'
      });

      if (error) {
        throw error;
      }

      toast.success('Connexion réussie');
      onClose();
    } catch (error) {
      toast.error('Erreur de connexion');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
        {/* Header */}
        <div className="relative bg-slate-900 px-6 py-8 text-center">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
          
          <div className="flex justify-center mb-4">
            <div className="bg-sky-500/10 p-3 rounded-xl">
              <KeyIcon className="h-8 w-8 text-sky-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {view === 'sign_in' ? 'Bienvenue sur SafeKey' : 'Créer un compte'}
          </h2>
          <p className="text-slate-400 text-sm">
            {view === 'sign_in' 
              ? 'Connectez-vous pour gérer vos clés API en toute sécurité'
              : 'Commencez à gérer vos clés API en quelques secondes'
            }
          </p>
        </div>

        <div className="p-6">
          {/* Demo Login Button */}
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full mb-6 bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 relative overflow-hidden group"
          >
            <Shield className="h-5 w-5 text-sky-400" />
            <span>{loading ? 'Connexion...' : 'Essayer la démo'}</span>
            <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-3" />
          </button>

          {/* Separator */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">
                ou
              </span>
            </div>
          </div>

          {/* Supabase Auth UI */}
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#0ea5e9',
                    brandAccent: '#0284c7',
                    inputBackground: 'transparent',
                    inputText: 'inherit',
                    inputBorder: '#e2e8f0',
                    inputBorderFocus: '#0ea5e9',
                    inputBorderHover: '#94a3b8',
                  },
                  space: {
                    inputPadding: '12px 16px',
                    buttonPadding: '12px 16px',
                  },
                  borderWidths: {
                    buttonBorderWidth: '0px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '12px',
                    buttonBorderRadius: '12px',
                    inputBorderRadius: '12px',
                  },
                },
              },
              className: {
                container: 'auth-container',
                button: 'auth-button hover:opacity-90 transition-opacity font-medium',
                input: 'auth-input bg-transparent border border-slate-200 dark:border-slate-700 focus:border-sky-500 dark:focus:border-sky-500 rounded-xl transition-colors',
                label: 'text-sm font-medium text-slate-700 dark:text-slate-300',
                anchor: 'text-sky-500 hover:text-sky-600 dark:hover:text-sky-400',
              },
            }}
            view={view}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Adresse email',
                  password_label: 'Mot de passe',
                  button_label: 'Se connecter',
                  loading_button_label: 'Connexion...',
                  social_provider_text: 'Continuer avec {{provider}}',
                  link_text: "Vous n'avez pas de compte ? Inscrivez-vous",
                },
                sign_up: {
                  email_label: 'Adresse email',
                  password_label: 'Mot de passe',
                  button_label: "S'inscrire",
                  loading_button_label: 'Inscription...',
                  social_provider_text: 'Continuer avec {{provider}}',
                  link_text: 'Déjà un compte ? Connectez-vous',
                },
              },
            }}
            providers={[]}
          />

          {/* Switch View Button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setView(view === 'sign_in' ? 'sign_up' : 'sign_in')}
              className="text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 text-sm transition-colors"
            >
              {view === 'sign_in' 
                ? "Pas encore de compte ? S'inscrire"
                : 'Déjà un compte ? Se connecter'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;