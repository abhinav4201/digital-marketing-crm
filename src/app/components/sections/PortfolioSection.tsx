"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import portfolioData from "../../../data/portfolio.json"; // Import the data

const PortfolioSection = () => {
  return (
    <section id='portfolio' className='py-20 bg-gray-100'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <h2 className='text-3xl font-extrabold text-gray-900 sm:text-4xl'>
            Our Work
          </h2>
          <p className='mt-4 text-lg text-gray-600'>
            Check out some of our recent projects.
          </p>
        </div>
        <div className='mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {portfolioData.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className='group relative block bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300'
            >
              <a href={project.link} target='_blank' rel='noopener noreferrer'>
                <div className='relative w-full h-80'>
                  {/* CORRECTED: Using the modern 'fill' prop */}
                  <Image
                    src={project.imageUrl}
                    alt={project.title}
                    fill
                    sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                    className='object-contain p-4' // Use Tailwind for object-fit
                  />
                </div>
                <div className='p-6 border-t border-gray-200'>
                  <h3 className='text-xl font-bold text-gray-900'>
                    {project.title}
                  </h3>
                  <p className='mt-2 text-sm text-gray-600'>
                    {project.description}
                  </p>
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;