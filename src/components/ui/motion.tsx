"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import React from "react";

export const fadeIn: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function MotionDiv({ children, variants = fadeIn, className, ...props }: HTMLMotionProps<"div"> & { children: React.ReactNode }) {
  return (
    <motion.div variants={variants} className={className} {...props}>
      {children}
    </motion.div>
  );
}

export function StaggerDiv({ children, className, ...props }: HTMLMotionProps<"div"> & { children: React.ReactNode }) {
  return (
    <motion.div 
      variants={staggerContainer} 
      initial="hidden" 
      animate="visible" 
      className={className} 
      {...props}
    >
      {children}
    </motion.div>
  );
}
