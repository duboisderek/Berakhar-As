import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  LogIn, 
  LogOut, 
  Trash2, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';

import { supabase } from '../lib/supabase';

const API_BASE = 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_login: string | null;
}

interface LoginUser {
  id: string;
  email: string;
  created_at: string;
  last_login: string;
}


export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<LoginUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form states
  const [registerForm, setRegisterForm] = useState({ 
    email: '', 
    password: '',
    firstName: '',
    lastName: ''
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'dashboard'>('register');

  useEffect(() => {
    fetchUsers();
    checkServerHealth();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const checkServerHealth = async () => {
    try {
      const { error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        showMessage('error', 'Database connection failed');
      }
    } catch (error) {
      showMessage('error', 'Cannot connect to database');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        showMessage('error', 'Failed to fetch users');
      }
    } catch (error) {
      showMessage('error', 'Failed to fetch users');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!registerForm.email || !registerForm.password || !registerForm.firstName || !registerForm.lastName) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerForm.email,
          password: registerForm.password,
          firstName: registerForm.firstName,
          lastName: registerForm.lastName
        })
      });

      if (response.ok) {
        showMessage('success', 'Account created successfully!');
        setRegisterForm({ email: '', password: '', firstName: '', lastName: '' });
        fetchUsers();
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          showMessage('error', 'Email already exists');
        } else {
          showMessage('error', errorData.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      showMessage('error', 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        })
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser({
          id: userData.id,
          email: userData.email,
          created_at: userData.created_at,
          last_login: new Date().toISOString()
        });
        
        showMessage('success', `Welcome back, ${userData.email}!`);
        setLoginForm({ email: '', password: '' });
        setActiveTab('dashboard');
        fetchUsers();
      } else {
        showMessage('error', 'Invalid email or password');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      showMessage('error', 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showMessage('success', 'Logged out successfully');
    setActiveTab('login');
  };

  const handleResetAllUsers = async () => {
    if (!window.confirm('Are you sure you want to delete ALL users? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/users/reset`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setUsers([]);
        setCurrentUser(null);
        showMessage('success', 'All users have been reset successfully');
        setActiveTab('register');
      } else {
        showMessage('error', 'Failed to reset users');
      }
    } catch (error) {
      showMessage('error', 'Network error during reset');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchUsers();
        showMessage('success', 'User deleted successfully');
        
        // If current user was deleted, log them out
        if (currentUser && currentUser.id === userId) {
          setCurrentUser(null);
          setActiveTab('login');
        }
      } else {
        showMessage('error', 'Failed to delete user');
      }
    } catch (error) {
      showMessage('error', 'Network error during deletion');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Users className="w-10 h-10 text-blue-600" />
            User Account Reset System
          </h1>
          <p className="text-gray-600">Complete user management with authentication and reset functionality</p>
        </motion.div>

        {/* Current User Status */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  Logged in as: {currentUser.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}

        {/* Message Display */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md">
            {[
              { key: 'register', label: 'Create Account', icon: UserPlus },
              { key: 'login', label: 'Login', icon: LogIn },
              { key: 'dashboard', label: 'Dashboard', icon: Users }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-md transition-all ${
                  activeTab === key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Forms Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Register Form */}
            {activeTab === 'register' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <UserPlus className="w-6 h-6 text-green-600" />
                  Create New Account
                </h2>
                
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Doe"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      dir="ltr"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password (6-20 alphanumeric characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                        dir="ltr"
                        placeholder="abc123def"
                        pattern="[a-zA-Z0-9]{6,20}"
                        title="6-20 alphanumeric characters only"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </form>
              </div>
            )}

            {/* Login Form */}
            {activeTab === 'login' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <LogIn className="w-6 h-6 text-blue-600" />
                  Login to Account
                </h2>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      dir="ltr"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                        dir="ltr"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>
              </div>
            )}

            {/* Dashboard Controls */}
            {activeTab === 'dashboard' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Users className="w-6 h-6 text-purple-600" />
                  User Management
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">System Statistics</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Users:</span>
                        <span className="font-bold text-blue-600 ml-2">{users.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Active Sessions:</span>
                        <span className="font-bold text-green-600 ml-2">{currentUser ? 1 : 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleResetAllUsers}
                    disabled={loading}
                    className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Reset All Users
                  </button>
                  
                  <button
                    onClick={fetchUsers}
                    disabled={loading}
                    className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Users
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Users List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Users className="w-6 h-6 text-indigo-600" />
              Registered Users ({users.length})
            </h2>
            
            {users.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No users registered yet</p>
                <p>Create your first account to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {users.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 border rounded-lg hover:shadow-md transition-all ${
                      currentUser && currentUser.id === user.id
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{user.email}</span>
                          {currentUser && currentUser.id === user.id && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Current User
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Created: {new Date(user.created_at).toLocaleDateString()}</div>
                          <div>
                            Last Login: {user.last_login 
                              ? new Date(user.last_login).toLocaleDateString()
                              : 'Never'
                            }
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-gray-500"
        >
          <p>User Account Reset System - Complete authentication and management solution</p>
          <p className="text-sm mt-1">Built with React, Node.js, SQLite, and bcrypt</p>
        </motion.div>
      </div>
    </div>
  );
}