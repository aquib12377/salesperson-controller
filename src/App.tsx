// src/App.tsx
import { useEffect } from 'react';
import './improved-style.css';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import FloorMapPage from './pages/FloorMapPage';
import AdminPage from './pages/AdminPage';
import ControlsSidebar from './components/ControlsSidebar';
import CastBanner from './components/CastBanner';
import { useAppStore } from './store';

function App() {
  const { currentPage, checkAuth  } = useAppStore();

   useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  // Reinitialize icons when page changes
  useEffect(() => {
    setTimeout(() => {
      if ((window as any).lucide) {
        (window as any).lucide.createIcons();
      }
    }, 100);
  }, [currentPage]);

  return (
    <>
      <LoginPage active={currentPage === 'login'} />
      <HomePage active={currentPage === 'home'} />
      <FloorMapPage active={currentPage === 'floorMap'} />
      <AdminPage active={currentPage === 'admin'} />
      <ControlsSidebar />
      <CastBanner />
    </>
  );
}

export default App;