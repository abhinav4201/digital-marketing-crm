"use client";
import { motion } from "framer-motion";
import { useModalStore } from "../../store/useModalStore";

const CTASection = () => {
  const { openModal } = useModalStore();

  return (
    <section className='bg-blue-600'>
      <div className='max-w-4xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8'>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className='text-3xl font-extrabold text-white sm:text-4xl'
        >
          <span className='block'>Ready to elevate your brand?</span>
          <span className='block text-blue-200'>
            Let&apos;s build something amazing together.
          </span>
        </motion.h2>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          onClick={openModal}
          className='mt-8 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-full shadow-sm text-base font-medium text-blue-600 bg-white hover:bg-blue-50 sm:w-auto'
        >
          Get a Free Quote
        </motion.button>
      </div>
    </section>
  );
};

export default CTASection;
