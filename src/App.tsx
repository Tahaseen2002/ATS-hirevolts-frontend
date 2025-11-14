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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        // Check if token is expired
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp > currentTime) {
          setUser(JSON.parse(storedUser));
        } else {
          // Token is expired, sign out
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          onSignOut();
        }
      } catch (err) {
        // Invalid token, sign out
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onSignOut();
      }
    } else {
      // If no token, trigger sign out
      onSignOut();
    }
    setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

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
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Check if token is expired
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp > currentTime) {
          setIsAuthenticated(true);
        } else {
          // Token is expired, remove it
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (err) {
        // Invalid token, remove it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/signin" element={
            <SignIn 
              onSignIn={handleSignIn} 
              onSwitchToSignUp={() => {}} 
            />
          } />
          <Route path="/signup" element={
            <SignUp 
              onSignUp={handleSignUp} 
              onSwitchToSignIn={() => {}} 
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