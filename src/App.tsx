import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import CandidateList from './components/CandidateList';
import JobList from './components/JobList';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import ForgotPassword from './components/ForgotPassword';

function MainLayout({ onSignOut }: { onSignOut: () => void }) {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // If no token, trigger sign out
      onSignOut();
    }
  }, [onSignOut]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Signed out successfully');
    onSignOut(); // This will update parent state and trigger re-render
  };

  // Get active tab from current route
  const getActiveTab = (): 'dashboard' | 'candidates' | 'jobs' => {
    if (location.pathname.startsWith('/candidates')) return 'candidates';
    if (location.pathname.startsWith('/jobs')) return 'jobs';
    return 'dashboard';
  };

  const handleTabChange = (tab: 'dashboard' | 'candidates' | 'jobs') => {
    navigate(`/${tab}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar 
        activeTab={getActiveTab()} 
        onTabChange={handleTabChange}
        user={user}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/candidates" element={<CandidateList />} />
          <Route path="/jobs" element={<JobList />} />
        </Routes>
      </main>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSignIn = (token: string, userData: any) => {
    setIsAuthenticated(true);
  };

  const handleSignUp = (token: string, userData: any) => {
    setIsAuthenticated(true);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/signin" element={
            <SignIn 
              onSignIn={handleSignIn} 
              onSwitchToSignUp={() => setAuthView('signup')} 
            />
          } />
          <Route path="/signup" element={
            <SignUp 
              onSignUp={handleSignUp} 
              onSwitchToSignIn={() => setAuthView('signin')} 
            />
          } />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      ) : (
        <MainLayout onSignOut={handleSignOut} />
      )}
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
