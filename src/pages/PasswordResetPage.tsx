import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle, Key, Eye, EyeOff } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function PasswordResetPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const { requestPasswordReset, resetPassword, validatePasswordStrength } = useAuth();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('יש להזין כתובת אימייל');
      return;
    }

    setLoading(true);
    try {
      const success = await requestPasswordReset(email);
      if (success) {
        setEmailSent(true);
        toast.success('קישור לאיפוס סיסמה נשלח לאימייל');
      } else {
        toast.error('שגיאה בשליחת קישור איפוס הסיסמה');
      }
    } catch (error) {
      toast.error('שגיאה בשליחת קישור איפוס הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error('יש למלא את כל השדות');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('הסיסמאות אינן תואמות');
      return;
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      toast.error(`הסיסמה אינה עומדת בדרישות האבטחה: ${strength.feedback.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const success = await resetPassword(token!, newPassword);
      if (success) {
        setResetComplete(true);
        toast.success('הסיסמה שונתה בהצלחה');
      } else {
        toast.error('קישור איפוס הסיסמה לא תקין או פג תוקפו');
      }
    } catch (error) {
      toast.error('שגיאה באיפוס הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = newPassword ? validatePasswordStrength(newPassword) : null;

  if (resetComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">הסיסמה שונתה!</h1>
          <p className="text-gray-600 mb-6">הסיסמה שלך שונתה בהצלחה. כעת תוכל להתחבר עם הסיסמה החדשה.</p>
          <Link
            to="/login"
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
          >
            התחבר עכשיו
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  if (emailSent && !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Mail className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">בדוק את האימייל</h1>
          <p className="text-gray-600 mb-6">
            שלחנו קישור לאיפוס סיסמה לכתובת: <strong>{email}</strong>
          </p>
          <p className="text-gray-500 text-sm mb-6">
            לא קיבלת את האימייל? בדוק בתיקיית הספאם או נסה שוב.
          </p>
          <button
            onClick={() => {
              setEmailSent(false);
              setEmail('');
            }}
            className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-lg font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-200"
          >
            נסה שוב
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            {token ? <Key className="w-8 h-8 text-white" /> : <Mail className="w-8 h-8 text-white" />}
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {token ? 'איפוס סיסמה' : 'שכחת סיסמה?'}
          </h1>
          <p className="text-gray-600">
            {token 
              ? 'הזן סיסמה חדשה לחשבונך' 
              : 'הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה'
            }
          </p>
        </div>

        {token ? (
          // Reset password form
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סיסמה חדשה
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                  placeholder="הכנס סיסמה חדשה"
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
              
              {/* Password Strength Indicator */}
              {passwordStrength && newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score <= 2 ? 'bg-red-500' :
                          passwordStrength.score <= 3 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score <= 2 ? 'text-red-600' :
                      passwordStrength.score <= 3 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.score <= 2 ? 'חלשה' :
                       passwordStrength.score <= 3 ? 'בינונית' :
                       'חזקה'}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-xs text-red-600 space-y-1">
                      {passwordStrength.feedback.map((feedback, index) => (
                        <li key={index}>• {feedback}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                אימות סיסמה חדשה
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                  placeholder="הכנס את הסיסמה שוב"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || (passwordStrength && !passwordStrength.isValid)}
              className={`w-full py-3 rounded-lg font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                loading || (passwordStrength && !passwordStrength.isValid)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
              }`}
              whileHover={loading || (passwordStrength && !passwordStrength.isValid) ? {} : { scale: 1.02 }}
              whileTap={loading || (passwordStrength && !passwordStrength.isValid) ? {} : { scale: 0.98 }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  מעדכן סיסמה...
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  עדכן סיסמה
                </>
              )}
            </motion.button>
          </form>
        ) : (
          // Request reset form
          <form onSubmit={handleRequestReset} className="space-y-6">
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

            <motion.button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
              }`}
              whileHover={loading ? {} : { scale: 1.02 }}
              whileTap={loading ? {} : { scale: 0.98 }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  שלח קישור איפוס
                </>
              )}
            </motion.button>
          </form>
        )}

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link 
            to="/login" 
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-1"
          >
            <ArrowRight className="w-4 h-4" />
            חזור להתחברות
          </Link>
        </div>
      </motion.div>
    </div>
  );
}