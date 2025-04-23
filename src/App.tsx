import React, { useState } from 'react';
import { Toaster, toast } from 'sonner';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import History from './pages/History';
import Settings from './pages/Settings';
import NewKeyModal from './components/NewKeyModal';
import AuthModal from './components/Auth';
import Landing from './components/Landing';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import static pages
import Features from './pages/static/Features';
import Pricing from './pages/static/Pricing';
import Security from './pages/static/Security';
import About from './pages/static/About';
import Contact from './pages/static/Contact';
import Status from './pages/static/Status';

type Page = 'dashboard' | 'projects' | 'history' | 'settings' | 
            'features' | 'pricing' | 'security' | 'about' | 'contact' | 'status';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  
  const { user, signOut } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNewKey = (data: { name: string; key: string; project?: string }) => {
    console.log('New key data:', data);
    toast.success('Nouvelle clé API créée avec succès !', {
      description: `La clé "${data.name}" a été ajoutée au projet ${data.project || 'Sans projet'}`,
    });
    setIsModalOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Déconnexion réussie');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNewKey={() => setIsModalOpen(true)} onNavigate={setCurrentPage} />;
      case 'projects':
        return <Projects />;
      case 'history':
        return <History />;
      case 'settings':
        return <Settings />;
      case 'features':
        return <Features />;
      case 'pricing':
        return <Pricing />;
      case 'security':
        return <Security />;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      case 'status':
        return <Status />;
      default:
        return <Dashboard onNewKey={() => setIsModalOpen(true)} onNavigate={setCurrentPage} />;
    }
  };

  if (!user) {
    return isAuthModalOpen ? (
      <AuthModal isOpen={true} onClose={() => setIsAuthModalOpen(false)} />
    ) : (
      <Landing onGetStarted={() => setIsAuthModalOpen(true)} />
    );
  }

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Toaster 
        position="top-right"
        expand={true}
        richColors
        theme="system"
      />
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        onNewKey={() => setIsModalOpen(true)}
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        user={user}
        onSignOut={handleSignOut}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4">
          {renderPage()}
        </main>
      </div>
      <NewKeyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleNewKey}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;