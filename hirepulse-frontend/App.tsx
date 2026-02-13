import React from 'react';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { AdminDashboard } from './pages/AdminDashboard';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { User, UserRole } from './types';
import { api } from './services/api';
import { setOnUnauthorizedCallback } from './services/apiClient';

const App: React.FC = () => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true); // Start true to check for session
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState('dashboard');

  const handleLogout = React.useCallback(() => {
    localStorage.removeItem('authToken');
    setUser(null);
  }, []);

  // Check for existing session on app load
  React.useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // In a real app, you'd verify the token and get user profile
          const userProfile = await api.auth.getProfile();
          setUser(userProfile);
          // Set default page based on role
          switch (userProfile.role) {
            case UserRole.ADMIN: setCurrentPage('admin-dash'); break;
            case UserRole.RECRUITER: setCurrentPage('rec-dash'); break;
            case UserRole.MANAGER: setCurrentPage('mgr-hub'); break;
            case UserRole.CANDIDATE: setCurrentPage('cand-jobs'); break;
          }
        } catch (error) {
          console.error("Session check failed, logging out.", error);
          handleLogout();
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, [handleLogout]);

  // Set up automatic logout on 401 errors from the API client
  React.useEffect(() => {
    setOnUnauthorizedCallback(handleLogout);
  }, [handleLogout]);

  // Simulate periodic syncing with backend
  React.useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 1500);
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const { user: userData, token } = await api.auth.login(email, password, role);
      localStorage.setItem('authToken', token);
      setUser(userData);
      // Set default page based on role
      switch (userData.role) {
        case UserRole.ADMIN: setCurrentPage('admin-dash'); break;
        case UserRole.RECRUITER: setCurrentPage('rec-dash'); break;
        case UserRole.MANAGER: setCurrentPage('mgr-hub'); break;
        case UserRole.CANDIDATE: setCurrentPage('cand-jobs'); break;
      }
    } catch (error) {
      console.error("Login failed", error);
      alert(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (!user) return null;
    
    // Mapping Pages to Roles/IDs
    if (currentPage.startsWith('admin')) return <AdminDashboard currentPage={currentPage} />;
    if (currentPage.startsWith('rec')) return <RecruiterDashboard currentPage={currentPage} />;
    if (currentPage.startsWith('mgr')) return <ManagerDashboard currentPage={currentPage} />;
    if (currentPage.startsWith('cand')) return <CandidateDashboard currentPage={currentPage} />;
    
    return <div className="p-12 text-center text-slate-400 font-bold uppercase">Module Not Loaded</div>;
  };

  if (isLoading) {
    // Show a loading spinner while checking for a session
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} isLoading={isLoading} />;
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout}
      isSyncing={isSyncing}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
