import { useState } from 'react';
import { User } from '../../App';
import welcomeBanner from 'figma:asset/009e266042c81144a9bb829f82f1276676a3b537.png';
import { Fingerprint } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'login') {
      // Mock login
      const mockUser: User = {
        id: '1',
        username: username || 'demo_user',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        avatarId: '1'
      };
      onLogin(mockUser);
    } else if (mode === 'register') {
      if (!email) {
        setMessage('Email is required');
        return;
      }
      // Mock registration
      const newUser: User = {
        id: Date.now().toString(),
        username,
        email,
        firstName,
        lastName,
        avatarId: '1'
      };
      onLogin(newUser);
    } else if (mode === 'forgot-password') {
      setMessage('Password reset link sent to your email!');
      setTimeout(() => {
        setMode('login');
        setMessage('');
      }, 2000);
    } else if (mode === 'reset-password') {
      if (password !== confirmPassword) {
        setMessage('Passwords do not match');
        return;
      }
      setMessage('Password updated successfully!');
      setTimeout(() => {
        setMode('login');
        setMessage('');
      }, 2000);
    }
  };

  const handlePasskeyLogin = () => {
    // Mock passkey login
    const mockUser: User = {
      id: '1',
      username: 'demo_user',
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      avatarId: '1'
    };
    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="mb-8">
          <img 
            src={welcomeBanner} 
            alt="Ultimate Fitness Challenge"
            className="w-full rounded-lg shadow-lg"
          />
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-gray-900 mb-6 text-center">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Account'}
            {mode === 'forgot-password' && 'Reset Password'}
            {mode === 'reset-password' && 'New Password'}
          </h2>

          {message && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {(mode === 'login' || mode === 'register') && (
              <div>
                <label className="block text-sm text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'forgot-password' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'reset-password') && (
              <div>
                <label className="block text-sm text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            )}

            {mode === 'reset-password' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              {mode === 'login' && 'Sign In'}
              {mode === 'register' && 'Create Account'}
              {mode === 'forgot-password' && 'Send Reset Link'}
              {mode === 'reset-password' && 'Update Password'}
            </button>

            {mode === 'login' && (
              <button
                type="button"
                onClick={handlePasskeyLogin}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Fingerprint className="w-5 h-5" />
                Sign in with Passkey
              </button>
            )}
          </form>

          <div className="mt-6 text-center">
            {mode === 'login' && (
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-green-600 hover:text-green-700"
                >
                  Sign up
                </button>
              </p>
            )}
            {(mode === 'register' || mode === 'forgot-password') && (
              <p className="text-sm text-gray-600">
                Back to{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-green-600 hover:text-green-700"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
