import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const timeUnits = [
    { label: 'ימים', value: timeLeft.days, color: 'from-red-500 to-red-600' },
    { label: 'שעות', value: timeLeft.hours, color: 'from-orange-500 to-orange-600' },
    { label: 'דקות', value: timeLeft.minutes, color: 'from-yellow-500 to-yellow-600' },
    { label: 'שניות', value: timeLeft.seconds, color: 'from-green-500 to-green-600' }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 rounded-2xl p-6 text-white" dir="rtl">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Clock className="w-6 h-6 text-amber-400" />
          זמן לטירה הבא
          <Calendar className="w-6 h-6 text-amber-400" />
        </h3>
        <p className="text-blue-200">
          הטירה הבא: יום {targetDate.toLocaleDateString('he-IL', { weekday: 'long' })} בשעה 20:00
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-br ${unit.color} rounded-xl p-4 text-center shadow-lg`}
          >
            <motion.div
              key={unit.value}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="text-3xl sm:text-4xl font-bold mb-1"
            >
              {unit.value.toString().padStart(2, '0')}
            </motion.div>
            <div className="text-sm opacity-90">{unit.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
      >
        <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 backdrop-blur-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">מכירת כרטיסים פעילה</span>
        </div>
      </motion.div>
    </div>
  );
}