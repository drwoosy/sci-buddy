"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

interface LandingScreenProps {
  onComplete: () => void;
  isLoading?: boolean;
}

export function LandingScreen({ onComplete, isLoading = false }: LandingScreenProps) {
  return (
    <motion.div
      initial={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ duration: 1.0, ease: "easeInOut" }}
      className="fixed inset-0 bg-white dark:bg-black z-50 flex flex-col items-center justify-center px-4"
    >
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 dark:text-white"
        >
          scibuddy.
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 2, duration: 2 }}
          className="text-lg sm:text-xl md:text-2xl dark:text-white"
        >
          a science bowl study app
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4, duration: 1.5 }}
          className="mt-8 sm:mt-12"
        >
          <button
            onClick={onComplete}
            className="transition-transform hover:scale-110"
            disabled={isLoading}
          >
            <ArrowDown 
              className={`w-8 h-8 sm:w-12 sm:h-12 dark:text-white ${isLoading ? 'opacity-50' : 'animate-bounce'}`}
            />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
} 