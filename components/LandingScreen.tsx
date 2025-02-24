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
          className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 dark:text-white"
        >
          scibuddy.
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 2, duration: 2 }}
          className="text-base sm:text-lg md:text-xl lg:text-2xl dark:text-white"
        >
          a science bowl study app
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4, duration: 1.5 }}
          className="mt-6 sm:mt-8 md:mt-10"
        >
          <button
            onClick={onComplete}
            className="transition-transform hover:scale-110"
            disabled={isLoading}
          >
            <ArrowDown 
              className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 dark:text-white ${isLoading ? 'opacity-50' : 'animate-bounce'}`}
            />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
} 