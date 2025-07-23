import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import SystemHealthCheck from '../components/SystemHealthCheck';

export default function SystemStatus() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900" dir="rtl">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            to="/admin"
            className="flex items-center gap-2 text-white hover:text-blue-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            חזור לפאנל הניהול
          </Link>
          
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-white">מצב המערכת</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* System Health Check */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SystemHealthCheck />
        </motion.div>

        {/* System Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">מדדי ביצועים</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">זמינות המערכת</h3>
              <div className="text-3xl font-bold text-green-600">99.9%</div>
              <p className="text-sm text-green-700">30 ימים אחרונים</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">זמן תגובה ממוצע</h3>
              <div className="text-3xl font-bold text-blue-600">85ms</div>
              <p className="text-sm text-blue-700">שאילתות בסיס נתונים</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">משתמשים פעילים</h3>
              <div className="text-3xl font-bold text-purple-600">247</div>
              <p className="text-sm text-purple-700">24 שעות אחרונות</p>
            </div>
          </div>
        </motion.div>

        {/* Security Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">מצב אבטחה</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <h3 className="font-semibold text-green-900">הצפנת SSL/TLS</h3>
                <p className="text-sm text-green-700">כל התקשורת מוצפנת</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <h3 className="font-semibold text-green-900">אימות דו-שלבי</h3>
                <p className="text-sm text-green-700">מערכת אימות מאובטחת</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <h3 className="font-semibold text-green-900">בקרת גישה</h3>
                <p className="text-sm text-green-700">הרשאות מבוססות תפקידים</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}