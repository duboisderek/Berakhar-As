import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Trophy, 
  Shield, 
  Clock, 
  Users, 
  Star,
  Bitcoin,
  Coins,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FloatingContact from '../components/FloatingContact';

export default function LandingPage() {
  const [jackpot, setJackpot] = useState(2850000);
  const [participants, setParticipants] = useState(1247);

  useEffect(() => {
    // Simulate live jackpot updates
    const interval = setInterval(() => {
      setJackpot(prev => prev + Math.floor(Math.random() * 100) + 50);
      setParticipants(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const winners = [
    { name: 'דוד כ.', amount: 485000, date: '2 ימים' },
    { name: 'מרים ל.', amount: 125000, date: '5 ימים' },
    { name: 'אברהם ש.', amount: 67000, date: '1 שבוע' },
  ];

  const cryptos = [
    { icon: Bitcoin, name: 'Bitcoin', symbol: 'BTC', color: 'text-orange-500' },
    { icon: Coins, name: 'Ethereum', symbol: 'ETH', color: 'text-blue-500' },
    { icon: DollarSign, name: 'USDT ERC-20', symbol: 'USDT_ERC20', color: 'text-green-500' },
    { icon: DollarSign, name: 'USDT TRC-20', symbol: 'USDT_TRC20', color: 'text-green-600' },
  ];

  const steps = [
    {
      icon: Users,
      title: 'הרשמה מהירה',
      description: 'צור חשבון תוך דקות עם פרטים בסיסיים'
    },
    {
      icon: Bitcoin,
      title: 'הפקדה קריפטוגרפית',
      description: 'הפקד BTC, ETH או USDT בצורה מאובטחת'
    },
    {
      icon: Trophy,
      title: 'זכייה בגדול!',
      description: 'בחר 6 מספרים וזכה בפרסים עד ₪5 מיליון'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900" dir="rtl">
      <FloatingContact />
      
      {/* Header */}
      <nav className="p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Link 
              to="/login" 
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-2 rounded-full hover:bg-white/20 transition-all duration-200"
            >
              כניסה
            </Link>
            <Link 
              to="/register" 
              className="bg-gradient-to-r from-amber-400 to-amber-600 text-black px-6 py-2 rounded-full font-bold hover:from-amber-500 hover:to-amber-700 transition-all duration-200"
            >
              הרשמה
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="text-2xl font-bold text-white">ברכה והצלחה</div>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-12 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
              הלוטו הקריפטוגרפי הראשון בישראל
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              זכה במיליונים עם מטבעות קריפטוגרפיים - מהיר, מאובטח ומשתלם!
            </p>
          </motion.div>

          {/* Live Jackpot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black rounded-2xl p-8 mb-12 shadow-2xl"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <Trophy className="w-8 h-8" />
              <h2 className="text-3xl font-bold">הג'קפוט הנוכחי</h2>
              <Trophy className="w-8 h-8" />
            </div>
            
            <motion.div
              key={jackpot}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl md:text-8xl font-bold mb-4"
            >
              ₪{jackpot.toLocaleString()}
            </motion.div>
            
            <div className="flex items-center justify-center gap-8 text-lg">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{participants.toLocaleString()} משתתפים</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>הגרלה ביום ה' 20:00</span>
              </div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link
              to="/register"
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-full text-xl font-bold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              התחל לשחק עכשיו
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link
              to="/about"
              className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-white/20 transition-all duration-200"
            >
              קרא על החוקים
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Supported Cryptos */}
      <section className="px-6 py-12 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white mb-8"
          >
            מטבעות קריפטוגרפיים נתמכים
          </motion.h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {cryptos.map((crypto, index) => (
              <motion.div
                key={`${crypto.symbol}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-200"
              >
                <crypto.icon className={`w-12 h-12 mx-auto mb-4 ${crypto.color}`} />
                <h3 className="font-bold text-white mb-1">{crypto.name}</h3>
                <p className="text-blue-200">{crypto.symbol.replace('_', ' ')}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-4"
          >
            איך זה עובד?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-blue-100 mb-12"
          >
            3 שלבים פשוטים לזכייה בגדול
          </motion.p>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 hover:bg-white/15 transition-all duration-200"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                <p className="text-blue-100">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Winners */}
      <section className="px-6 py-16 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-12"
          >
            זוכים אחרונים
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {winners.map((winner, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-400/30 rounded-xl p-6"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{winner.name}</h3>
                <p className="text-3xl font-bold text-green-400 mb-2">₪{winner.amount.toLocaleString()}</p>
                <p className="text-blue-200">לפני {winner.date}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Trust */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8"
          >
            <Shield className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              מאובטח ומהימן 100%
            </h2>
            <p className="text-xl text-blue-100 mb-6">
              אנו משתמשים בטכנולוגיות אבטחה מתקדמות ובלוקצ'יין להבטחת שקיפות מלאה
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-green-400">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>הצפנת SSL</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>אימות בלוקצ'יין</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>שקיפות מלאה</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black rounded-2xl p-12"
          >
            <h2 className="text-4xl font-bold mb-4">
              מוכן להיות המיליונר הבא?
            </h2>
            <p className="text-xl mb-8">
              הצטרף לאלפי משתתפים שכבר זוכים כל שבוע!
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              התחל עכשיו - זה חינם!
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/20 bg-black/20 backdrop-blur-sm p-6 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span className="text-2xl font-bold">ברכה והצלחה</span>
          </div>
          <p className="text-blue-200 mb-4">
            הלוטו הקריפטוגרפי המהימן והמאובטח בישראל
          </p>
          <div className="flex justify-center gap-6 text-sm text-blue-300">
            <Link to="/about" className="hover:text-white">חוקים ותקנון</Link>
            <Link to="/contact" className="hover:text-white">צור קשר</Link>
            <Link to="/privacy" className="hover:text-white">פרטיות</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}