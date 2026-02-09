import { useState, useEffect } from 'react';
import { useAppStore } from '../store';

interface Props { active: boolean; }

// Hardcoded credentials
const SALES_PERSONS = [
  { username: 'sales1', password: 'sales123', name: 'Sales Person 1' },
  { username: 'sales2', password: 'sales123', name: 'Sales Person 2' },
  { username: 'sales3', password: 'sales123', name: 'Sales Person 3' },
  { username: 'sales4', password: 'sales123', name: 'Sales Person 4' },
  { username: 'sales5', password: 'sales123', name: 'Sales Person 5' }
];

const ADMIN = { username: 'admin', password: 'admin123', name: 'Administrator' };

export default function LoginPage({ active }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setClientIdentity, setUserRole, setPage, loadCSVData } = useAppStore();

  useEffect(() => {
    if (active && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, [active]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check admin credentials
    if (username === ADMIN.username && password === ADMIN.password) {
      console.log('[LoginPage] Admin login successful');
      const clientId = crypto.randomUUID();
      setClientIdentity(clientId, ADMIN.name);
      setUserRole('admin');
      await loadCSVData();
      setPage('admin');
      return;
    }

    // Check sales person credentials
    const salesPerson = SALES_PERSONS.find(
      sp => sp.username === username && sp.password === password
    );

    if (salesPerson) {
      console.log('[LoginPage] Sales person login successful:', salesPerson.name);
      const clientId = crypto.randomUUID();
      setClientIdentity(clientId, salesPerson.name);
      setUserRole('sales');
      await loadCSVData();
      setPage('home');
      return;
    }

    // Invalid credentials
    setError('Invalid username or password');
    console.warn('[LoginPage] Login failed for username:', username);
  };

  if (!active) return null;

  return (
    <div className="page active min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="JP Logo" 
            className="h-20 w-auto mx-auto mb-4" 
            onError={(e) => (e.currentTarget.style.display = 'none')} 
          />
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">JP Infra</h1>
          <p className="text-white/70 text-base">Building Control System</p>
        </div>

        <div className="glass rounded-2xl p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">Login</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i data-lucide="user" className="w-5 h-5 text-white/50"></i>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i data-lucide="lock" className="w-5 h-5 text-white/50"></i>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                <i data-lucide="alert-circle" className="w-5 h-5 text-red-400"></i>
                <span className="text-red-200 text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <i data-lucide="log-in" className="w-5 h-5"></i>
              <span>Login</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/50 text-xs text-center">
              Contact admin for credentials
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}