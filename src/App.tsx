// src/App.tsx
import { useEffect } from 'react';
import './improved-style.css';
import HomePage from './pages/HomePage';
import FloorMapPage from './pages/FloorMapPage';
import ControlsSidebar from './components/ControlsSidebar';
import CastBanner from './components/CastBanner';
import { useAppStore } from './store';

function App() {
  const { 
    currentPage, 
    setClientIdentity,
    loadCSVData 
  } = useAppStore();

  useEffect(() => {
    // Initialize client identity
    const clientId = getClientId();
    const displayName = getDisplayName();
    setClientIdentity(clientId, displayName);

    // Load CSV data
    loadCSVData();

    // Initialize Lucide icons
    if ((window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, [setClientIdentity, loadCSVData]);

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
      <HomePage active={currentPage === 'home'} />
      <FloorMapPage active={currentPage === 'floorMap'} />
      <ControlsSidebar />
      <CastBanner />
    </>
  );
}

function getClientId(): string {
  const KEY = 'cast_client_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = (crypto && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

function getDisplayName(): string {
  const KEY = 'salesperson_name';
  let name = localStorage.getItem(KEY) || '';
  if (!name) {
    name = prompt('Enter your name (for casting display):') || 'Salesperson';
    name = name.trim();
    if (name) localStorage.setItem(KEY, name);
  }
  return name;
}

export default App;