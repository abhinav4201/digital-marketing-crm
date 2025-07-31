"use client";
import { motion } from "framer-motion";
import { FaPaintBrush, FaCode, FaBullhorn } from "react-icons/fa";

const services = [
  {
    icon: <FaPaintBrush className='h-12 w-12 text-cyan-400' />,
    title: "Social Media Design",
    description:
      "Captivating visuals for your social media channels that grab attention and drive engagement.",
  },
  {
    icon: <FaCode className='h-12 w-12 text-cyan-400' />,
    title: "Web Development",
    description:
      "Modern, responsive, and fast websites built with the latest technologies to give you a competitive edge.",
  },
  {
    icon: <FaBullhorn className='h-12 w-12 text-cyan-400' />,
    title: "Digital Marketing",
    description:
      "Comprehensive marketing strategies including SEO, PPC, and content marketing to boost your online presence.",
  },
];

const ServicesSection = () => {
  return (
    <section className='py-20 bg-gray-800'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <h2 className='text-3xl font-extrabold text-white sm:text-4xl'>
            Our Services
          </h2>
          <p className='mt-4 text-lg text-gray-400'>
            We offer a wide range of services to help your business succeed
            online.
          </p>
        </div>
        <div className='mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3'>
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className='bg-gray-900 rounded-lg shadow-lg p-8 text-center'
            >
              <div className='flex justify-center'>{service.icon}</div>
              <h3 className='mt-6 text-xl font-semibold text-white'>
                {service.title}
              </h3>
              <p className='mt-2 text-base text-gray-400'>
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
