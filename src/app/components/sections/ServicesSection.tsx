/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { motion } from "framer-motion";
import { FaPaintBrush, FaCode, FaBullhorn } from "react-icons/fa";
import { useState } from "react";
import ServiceDetailModal from "../ui/ServiceDetailModal";

const services = [
  {
    icon: <FaPaintBrush className='h-12 w-12' />,
    title: "Social Media Design",
    description:
      "Captivating visuals for your social channels that grab attention and drive engagement.",
    details:
      "Our social media design service focuses on creating a cohesive and visually stunning brand presence across all your platforms. We craft everything from profile pictures and cover photos to daily posts and story templates that resonate with your audience.",
    points: [
      "Custom branded templates",
      "Engaging infographic design",
      "Video and animation shorts",
      "Consistent visual identity",
    ],
  },
  {
    icon: <FaCode className='h-12 w-12' />,
    title: "Web Development",
    description:
      "Modern, responsive websites built with the latest technologies for a competitive edge.",
    details:
      "We build high-performance, mobile-first websites and web applications tailored to your business needs. Our focus is on creating secure, scalable, and user-friendly digital experiences that drive conversions and deliver measurable results.",
    points: [
      "Next.js & React development",
      "E-commerce solutions (Shopify/WooCommerce)",
      "Headless CMS integration",
      "Performance optimization",
    ],
  },
  {
    icon: <FaBullhorn className='h-12 w-12' />,
    title: "Digital Marketing",
    description:
      "Comprehensive marketing strategies including SEO, PPC, and content to boost your online presence.",
    details:
      "Our digital marketing strategies are data-driven and designed to increase your visibility, generate qualified leads, and maximize your ROI. We combine technical SEO, targeted ad campaigns, and compelling content to build your brand's authority.",
    points: [
      "Search Engine Optimization (SEO)",
      "Pay-Per-Click (PPC) campaigns",
      "Content strategy & creation",
      "Analytics and performance reporting",
    ],
  },
];

const ServicesSection = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const openModal = (service: any) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedService(null);
  };

  return (
    <>
      <section id='services' className='py-20 bg-gray-800'>
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
                className='bg-gray-900 rounded-lg shadow-lg p-8 text-center flex flex-col'
              >
                <div className='flex justify-center text-cyan-400'>
                  {service.icon}
                </div>
                <h3 className='mt-6 text-xl font-semibold text-white'>
                  {service.title}
                </h3>
                <p className='mt-2 text-base text-gray-400 flex-grow'>
                  {service.description}
                </p>
                <button
                  onClick={() => openModal(service)}
                  className='mt-6 bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-600 transition duration-300'
                >
                  Learn More
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <ServiceDetailModal
        isOpen={modalOpen}
        onClose={closeModal}
        service={selectedService}
      />
    </>
  );
};

export default ServicesSection;
