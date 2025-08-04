"use client";
import { motion } from "framer-motion";

interface AnimatedGradientProps {
  fromColor: string;
  viaColor: string;
  toColor: string;
  duration: number;
}

const AnimatedGradientBackground = ({
  fromColor,
  viaColor,
  toColor,
  duration,
}: AnimatedGradientProps) => {
  return (
    <div className='absolute inset-0 z-0 overflow-hidden'>
      <div className='absolute inset-0 bg-slate-900' />
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${fromColor} ${viaColor} ${toColor}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration, repeat: Infinity, repeatType: "mirror" }}
      />
    </div>
  );
};

export default AnimatedGradientBackground;
