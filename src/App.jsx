import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import UserApp from './views/UserApp';
import AdminApp from './views/AdminApp';

function App() {
  const getViewFromHash = () => {
    const hash = window.location.hash;
    if (hash === '#/admin') return 'admin';
    return 'user';
  };

  const [view, setView] = useState(getViewFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      setView(getViewFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <AppProvider>
      {view === 'admin' ? <AdminApp /> : <UserApp />}
    </AppProvider>
  );
}

export default App;
