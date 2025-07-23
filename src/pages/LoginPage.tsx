import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<Date | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('יש למלא את כל השדות');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password, rememberMe);
      
      if (result.success) {
        toast.success('התחברת בהצלחה!');
        navigate('/home');
      } else {
        if (result.accountLocked) {
          setAccountLocked(true);
          setLockoutTime(result.lockoutTime || null);
          toast.error(result.error || 'החשבון נעול זמנית');
        } else {
          toast.error(result.error || 'שגיאה בהתחברות');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ברוכים השבים</h1>
          <p className="text-gray-600">התחבר לחשבונך וזכה בגדול!</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              כתובת אימייל
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="הכנס את כתובת האימייל שלך"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סיסמה
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                placeholder="הכנס את הסיסמה שלך"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Account Locked Warning */}
          {accountLocked && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-red-900 mb-2">⚠️ החשבון נעול זמנית</h4>
              <p className="text-red-800 text-sm mb-2">
                החשבון נעול עקב ניסיונות התחברות כושלים מרובים.
              </p>
              {lockoutTime && (
                <p className="text-red-700 text-sm">
                  הנעילה תסתיים ב: {lockoutTime.toLocaleString('he-IL')}
                </p>
              )}
            </div>
          )}

          {/* Remember Me */}
          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="mr-2 block text-sm text-gray-700">
              זכור אותי למשך 30 יום
            </label>
          </div>

          <motion.button
            type="submit"
            disabled={loading || accountLocked}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              loading || accountLocked
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
            }`}
            whileHover={loading || accountLocked ? {} : { scale: 1.02 }}
            whileTap={loading || accountLocked ? {} : { scale: 0.98 }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                מתחבר...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                התחבר לחשבון
              </>
            )}
          </motion.button>
        </form>

        {/* Links */}
        <div className="mt-6 space-y-4">
          <div className="text-center">
            <Link 
              to="/reset-password" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              שכחת סיסמה?
            </Link>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <p className="text-center text-gray-600 text-sm mb-4">
              עדיין אין לך חשבון?
            </p>
            <Link
              to="/register"
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              צור חשבון חדש
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link 
            to="/" 
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-1"
          >
            <ArrowRight className="w-4 h-4" />
            חזור לעמוד הבית
          </Link>
        </div>
      </motion.div>
    </div>
  );
}