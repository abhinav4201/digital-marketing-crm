"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const projects = [
  {
    title: "Sarkari Mock Test",
    description: "An online platform for government exam preparation.",
    imageUrl: "/sarkari-mock-test.png", // You'll need to add this image to your public folder
    link: "https://sarkari-mock-test.vercel.app/",
  },
  // Add more projects here
];

const PortfolioSection = () => {
  return (
    <section className='py-20 bg-gray-900'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <h2 className='text-3xl font-extrabold text-white sm:text-4xl'>
            Our Work
          </h2>
          <p className='mt-4 text-lg text-gray-400'>
            Check out some of our recent projects.
          </p>
        </div>
        <div className='mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className='group relative'
            >
              <div className='relative w-full h-80 bg-white rounded-lg overflow-hidden shadow-lg'>
                <Image
                  src={project.imageUrl}
                  alt={project.title}
                  layout='fill'
                  objectFit='cover'
                  className='group-hover:opacity-75 transition-opacity'
                />
              </div>
              <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                <div className='text-center'>
                  <h3 className='text-xl font-bold text-white'>
                    {project.title}
                  </h3>
                  <p className='text-sm text-gray-300'>{project.description}</p>
                  <a
                    href={project.link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='mt-4 inline-block bg-cyan-500 text-white py-2 px-4 rounded-lg hover:bg-cyan-600'
                  >
                    View Project
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
