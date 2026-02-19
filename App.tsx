import React, { useState } from 'react';
import { AppView, ModuleId, User } from './types';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.AUTH);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleId>(ModuleId.DASHBOARD);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView(AppView.DASHBOARD);
    setActiveModule(ModuleId.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView(AppView.AUTH);
    setActiveModule(ModuleId.DASHBOARD);
  };

  const handleNavigate = (moduleId: ModuleId) => {
    setActiveModule(moduleId);
  };

  return (
    <>
      {currentView === AppView.AUTH && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
      
      {currentView === AppView.DASHBOARD && currentUser && (
        <Dashboard 
          user={currentUser} 
          activeModule={activeModule}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}
    </>
  );
};

export default App;