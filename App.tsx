import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { LoginView } from './views/LoginView';
import { AdminDashboard } from './views/AdminDashboard';
import { RenterPortal } from './views/RenterPortal';

const AppContent: React.FC = () => {
  const { currentUser } = useApp();

  let content;
  if (!currentUser.role) {
    return <LoginView />;
  } else if (currentUser.role === 'admin') {
    content = <AdminDashboard />;
  } else {
    content = <RenterPortal />;
  }

  return <Layout>{content}</Layout>;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
