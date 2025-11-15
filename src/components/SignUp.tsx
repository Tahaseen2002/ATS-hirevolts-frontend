import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

interface SignUpProps {
  onSignUp: (token: string, user: any) => void;
  onSwitchToSignIn: () => void;
}

export default function SignUp({ onSignUp, onSwitchToSignIn }: SignUpProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'recruiter'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // Password validation checks
  const passwordValidation = {
    length: formData.password.length >= 8,
    hasNumber: /\d/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    matches: formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
  };

  const isPasswordValid = passwordValidation.length && 
                          passwordValidation.hasNumber && 
                          passwordValidation.hasSpecialChar;
  
  const isFormValid = isPasswordValid && 
                      passwordValidation.matches && 
                      formData.name && 
                      formData.email;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
    
    // Mark password fields as touched when user starts typing
    if (name === 'password') {
      setPasswordTouched(true);
    }
    if (name === 'confirmPassword') {
      setConfirmPasswordTouched(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't proceed if form is invalid
    if (!isFormValid) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://ats-portal-hirevolts.onrender.com/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up');
      }

      // Save token to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('Account created successfully!');
      onSignUp(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to sign up';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8"><div className="inline-flex items-center justify-center w-32 sm:w-32 h-8 sm:h-10 overflow-hidden mb-4">
            <img
                src="/hirevolts-logo-DHaFBxL3.svg"
                alt="ATS Portal Logo"
                className="w-20 sm:w-32 h-20 sm:h-32"
              />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join the ATS-Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="recruiter">Recruiter</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="••••••••"
              required
            />
            
            {/* Password requirements - show when user starts typing */}
            {passwordTouched && (
              <div className="mt-2 space-y-1">
                <div className={`text-xs flex items-center ${
                  passwordValidation.length ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span className="mr-2">{passwordValidation.length ? '✓' : '✗'}</span>
                  At least 8 characters
                </div>
                <div className={`text-xs flex items-center ${
                  passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span className="mr-2">{passwordValidation.hasNumber ? '✓' : '✗'}</span>
                  Contains a number
                </div>
                <div className={`text-xs flex items-center ${
                  passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span className="mr-2">{passwordValidation.hasSpecialChar ? '✓' : '✗'}</span>
                  Contains a special character (!@#$%^&*)
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                confirmPasswordTouched && !passwordValidation.matches && formData.confirmPassword
                  ? 'border-red-500 focus:ring-red-600' 
                  : 'border-gray-300 focus:ring-blue-600'
              }`}
              placeholder="••••••••"
              required
            />
            
            {/* Show match status when user starts typing confirm password */}
            {confirmPasswordTouched && formData.confirmPassword && (
              <div className="mt-2">
                {passwordValidation.matches ? (
                  <div className="text-xs flex items-center text-green-600">
                    <span className="mr-2">✓</span>
                    Passwords match
                  </div>
                ) : (
                  <div className="text-xs flex items-center text-red-600">
                    <span className="mr-2">✗</span>
                    Passwords do not match
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  onSwitchToSignIn();
                  navigate('/signin');
                }}
                className="text-blue-600 font-semibold hover:text-blue-700"
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
