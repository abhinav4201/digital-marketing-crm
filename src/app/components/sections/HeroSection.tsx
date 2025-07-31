"use client";
import { motion } from "framer-motion";
import { useModalStore } from "../../store/useModalStore";

const HeroSection = () => {
  const { openModal } = useModalStore();

  return (
    <section className='relative h-screen flex items-center justify-center text-center overflow-hidden bg-slate-900'>
      {/* Animated SVG Background */}
      <div className='absolute inset-0 z-0 opacity-50'>
        <svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>
          <defs>
            <pattern
              id='pattern-circles'
              x='0'
              y='0'
              width='40'
              height='40'
              patternUnits='userSpaceOnUse'
              patternContentUnits='userSpaceOnUse'
            >
              <circle
                id='pattern-circle'
                cx='20'
                cy='20'
                r='1'
                fill='rgba(255, 255, 255, 0.2)'
              ></circle>
            </pattern>
          </defs>
          <rect width='100%' height='100%' fill='url(#pattern-circles)'></rect>
        </svg>
      </div>
      <div className='z-10 px-4'>
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className='text-5xl md:text-7xl font-extrabold text-white'
        >
          Elevate Your <span className='text-cyan-400'>Digital Presence</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className='mt-4 max-w-2xl mx-auto text-lg md:text-xl text-slate-300'
        >
          We craft stunning websites, powerful marketing strategies, and
          beautiful social media campaigns to help your business grow.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className='mt-8'
        >
          <button
            onClick={openModal}
            className='bg-cyan-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-cyan-600 transition duration-300'
          >
            Get a Free Quote
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
