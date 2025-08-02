"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const teamMembers = [
  {
    name: "Abhinav Anand",
    role: "Founder & CEO",
    imageUrl: "/team/abhinav.svg",
  },
  {
    name: "Shashank Singh",
    role: "CTO",
    imageUrl: "/team/shashank.svg",
  },
  {
    name: "Pishu Anand",
    role: "Marketing Director",
    imageUrl: "/team/pishu.svg",
  },
];

const TeamSection = () => {
  return (
    <section id='team' className='py-20 bg-gray-800'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <h2 className='text-3xl font-extrabold text-white sm:text-4xl'>
            Meet Our Team
          </h2>
          <p className='mt-4 text-lg text-gray-400'>
            The passionate experts driving our agency forward.
          </p>
        </div>
        <div className='mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3'>
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className='text-center'
            >
              <div className='relative h-48 w-48 mx-auto rounded-full overflow-hidden shadow-lg'>
                {/* CORRECTED: Using the modern 'fill' prop */}
                <Image
                  src={member.imageUrl}
                  alt={member.name}
                  fill
                  sizes='12rem' // 48 * 4 = 192px = 12rem
                  className='object-cover'
                />
              </div>
              <h3 className='mt-6 text-xl font-semibold text-white'>
                {member.name}
              </h3>
              <p className='text-cyan-400'>{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;