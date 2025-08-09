"use client";
import { motion } from "framer-motion";
import { useModalStore } from "../../store/useModalStore";
import { CheckCircle } from "lucide-react";
import { shouldShowDynamicCTA } from "../../utils/timeBasedVisibility"; // Import the logic

const CTASection = () => {
  const { openModal } = useModalStore();

  // Determine if the special offer pricing should be shown
  const showSpecialOffer = shouldShowDynamicCTA();

  const plans = [
    {
      name: "Static Website",
      // DYNAMIC PRICING: Show different prices based on the logic
      originalPrice: showSpecialOffer ? "₹10,000" : "₹12,000",
      price: showSpecialOffer ? "₹2,000" : "₹4,000",
      description: "Ideal for portfolios, landing pages, and small businesses.",
      features: [
        "Up to 5 Pages",
        "Responsive Design",
        "Contact Form",
        "Basic SEO Setup",
      ],
    },
    {
      name: "Dynamic Website",
      // DYNAMIC PRICING: Show different prices based on the logic
      price: showSpecialOffer ? "₹5,000+" : "₹8,000+",
      description: "Perfect for blogs, e-commerce, and interactive sites.",
      features: [
        "Content Management System (CMS)",
        "User Accounts",
        "Database Integration",
        "Advanced SEO & Analytics",
      ],
    },
  ];

  return (
    <section className='bg-gray-900 text-white'>
      <div className='max-w-7xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8'>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className='text-3xl font-extrabold sm:text-4xl'
        >
          <span className='block'>Choose Your Plan</span>
          {/* DYNAMIC TEXT: Change the heading based on the offer */}
          <span className='block text-cyan-400'>
            {showSpecialOffer
              ? "Limited Time Offer - Get Started Today!"
              : "Standard Pricing - Start Your Project"}
          </span>
        </motion.h2>

        <div className='mt-12 grid grid-cols-1 md:grid-cols-2 gap-8'>
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className='bg-gray-800 p-8 rounded-xl shadow-lg flex flex-col'
            >
              <h3 className='text-2xl font-bold'>{plan.name}</h3>
              <div className='my-4'>
                {plan.originalPrice && (
                  <span className='text-xl line-through text-gray-500 mr-2'>
                    {plan.originalPrice}
                  </span>
                )}
                <span className='text-4xl font-extrabold text-cyan-400'>
                  {plan.price}
                </span>
              </div>
              <p className='text-gray-400 flex-grow'>{plan.description}</p>
              <ul className='mt-6 space-y-3 text-left'>
                {plan.features.map((feature, i) => (
                  <li key={i} className='flex items-center'>
                    <CheckCircle className='w-5 h-5 text-green-500 mr-3' />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openModal(plan.name)}
                className='mt-8 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300'
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CTASection;
