"use client";
import { motion } from "framer-motion";
import { useModalStore } from "../../store/useModalStore";

const HeroSection = () => {
  const { openModal } = useModalStore();

  return (
    <section className='relative h-screen flex items-center justify-center text-center overflow-hidden'>
      {/* Animated Gradient Background */}
      <div className='absolute inset-0 z-0'>
        <div className='absolute inset-0 bg-slate-900' />
        <motion.div
          className='absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-700'
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 15, repeat: Infinity, repeatType: "mirror" }}
        />
      </div>

      <div className='z-10 px-4'>
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className='text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tighter'
        >
          We Build Digital <br />
          <motion.span
            className='text-cyan-400'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeInOut" }}
          >
            Experiences
          </motion.span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className='mt-6 max-w-2xl mx-auto text-lg md:text-xl text-slate-300'
        >
          A full-service digital agency based in the heart of India, crafting
          bespoke solutions in web development, marketing, and design to elevate
          your brand.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            delay: 1.2,
            type: "spring",
            stiffness: 100,
          }}
          className='mt-10'
        >
          <button
            onClick={openModal}
            className='bg-white text-slate-900 font-bold py-4 px-10 rounded-full text-lg hover:bg-cyan-400 hover:text-white transition-all duration-300 shadow-lg transform hover:scale-105'
          >
            Start Your Project
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
