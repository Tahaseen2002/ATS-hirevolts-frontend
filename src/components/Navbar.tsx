import { LayoutDashboard, Users, Briefcase, User, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface NavbarProps {
  activeTab: 'dashboard' | 'candidates' | 'jobs';
  onTabChange: (tab: 'dashboard' | 'candidates' | 'jobs') => void;
  user?: { name: string; email: string; role: string };
  onSignOut?: () => void;
}

export default function Navbar({ activeTab, onTabChange, user, onSignOut }: NavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOutClick = () => {
    setShowProfileMenu(false);
    setShowSignOutModal(true);
  };

  const confirmSignOut = () => {
    setShowSignOutModal(false);
    onSignOut?.();
  };
  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center justify-center w-20 sm:w-32 h-8 sm:h-10 overflow-hidden">
              <img
                src="/hirevolts-logo-DHaFBxL3.svg"
                alt="ATS Portal Logo"
                className="w-20 sm:w-32 h-20 sm:h-32"
              />
            </div>
            <h1 className="text-base sm:text-xl font-bold text-gray-900">- ATS Portal</h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 font-medium transition-colors flex-1 sm:flex-none ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-base">Dashboard</span>
            </button>

            <button
              onClick={() => onTabChange('candidates')}
              className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 font-medium transition-colors flex-1 sm:flex-none ${
                activeTab === 'candidates'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-base">Candidates</span>
            </button>

            <button
              onClick={() => onTabChange('jobs')}
              className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 font-medium transition-colors flex-1 sm:flex-none ${
                activeTab === 'jobs'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-base">Jobs</span>
            </button>
            
            {user && onSignOut && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${
                    showProfileMenu ? 'rotate-180' : ''
                  }`} />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-blue-600 capitalize mt-1">{user.role}</p>
                    </div>
                    <button
                      onClick={handleSignOutClick}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Sign Out</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to sign out? You'll need to sign in again to access the portal.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowSignOutModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                No, Stay
              </button>
              <button
                onClick={confirmSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
