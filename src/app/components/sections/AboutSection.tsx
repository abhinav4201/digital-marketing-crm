"use client";
import { motion } from "framer-motion"; // Corrected Import
import { Eye, Rocket } from "lucide-react";

const AboutSection = () => {
  return (
    <section id='about' className='py-24 bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center'>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className='text-3xl font-extrabold text-gray-900 sm:text-4xl'>
              A Digital Agency Built on Trust and Results.
            </h2>
            <p className='mt-4 text-lg text-gray-600'>
              Founded in <span className='font-bold text-blue-600'>2018</span>,
              our agency was born from a passion for helping businesses thrive
              in the digital landscape. We believe in building partnerships, not
              just projects.
            </p>
          </motion.div>

          <div className='mt-12 lg:mt-0 space-y-10'>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className='flex'
            >
              <div className='flex-shrink-0'>
                <div className='flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white'>
                  <Eye size={28} />
                </div>
              </div>
              <div className='ml-4'>
                <h3 className='text-xl font-bold text-gray-900'>Our Vision</h3>
                <p className='mt-2 text-base text-gray-600'>
                  To be the most trusted digital partner, empowering businesses
                  to achieve sustainable growth through innovation.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className='flex'
            >
              <div className='flex-shrink-0'>
                <div className='flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white'>
                  <Rocket size={28} />
                </div>
              </div>
              <div className='ml-4'>
                <h3 className='text-xl font-bold text-gray-900'>Our Mission</h3>
                <p className='mt-2 text-base text-gray-600'>
                  To craft data-driven strategies and compelling digital
                  experiences that connect our clients with their audiences.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

