import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // Password validation
  const passwordValidation = {
    length: newPassword.length >= 8,
    hasNumber: /\d/.test(newPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    matches: newPassword && confirmPassword && newPassword === confirmPassword
  };

  const isPasswordValid = passwordValidation.length && 
                          passwordValidation.hasNumber && 
                          passwordValidation.hasSpecialChar;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset code');
      }

      toast.success('Reset code sent to your email!');
      // In development, show the token (remove in production)
      if (data.resetToken) {
        console.log('='.repeat(50));
        console.log('PASSWORD RESET CODE:', data.resetToken);
        console.log('Email:', email);
        console.log('='.repeat(50));
        toast.success(`Your code is: ${data.resetToken}`, { duration: 10000 });
      }
      setStep('verify');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid reset code');
      }

      toast.success('Code verified successfully!');
      setStep('reset');
    } catch (err: any) {
      toast.error(err.message || 'Invalid reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid || !passwordValidation.matches) {
      toast.error('Please fix password errors');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      toast.success('Password reset successfully!');
      setTimeout(() => {
        navigate('/signin');
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <button
          onClick={() => navigate('/signin')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sign In
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'email' && 'Forgot Password'}
            {step === 'verify' && 'Verify Code'}
            {step === 'reset' && 'Reset Password'}
          </h1>
          <p className="text-gray-600">
            {step === 'email' && 'Enter your email to receive a reset code'}
            {step === 'verify' && 'Enter the 6-digit code sent to your email'}
            {step === 'reset' && 'Create a new password for your account'}
          </p>
        </div>

        {/* Step 1: Enter Email */}
        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {/* Step 2: Verify Code */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reset Code
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Code sent to {email}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Change Email
              </button>
              <button
                type="submit"
                disabled={loading || token.length !== 6}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordTouched(true);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="••••••••"
                required
              />
              
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
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmPasswordTouched(true);
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  confirmPasswordTouched && !passwordValidation.matches && confirmPassword
                    ? 'border-red-500 focus:ring-red-600' 
                    : 'border-gray-300 focus:ring-blue-600'
                }`}
                placeholder="••••••••"
                required
              />
              
              {confirmPasswordTouched && confirmPassword && (
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
              disabled={loading || !isPasswordValid || !passwordValidation.matches}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
