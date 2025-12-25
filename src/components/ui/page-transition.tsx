"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

const variants: Variants = {
    initial: {
        opacity: 0,
        scale: 0.98,
        filter: "blur(10px)"
    },
    animate: {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1] // Custom ease-out cubic
        }
    },
    exit: {
        opacity: 0,
        scale: 1.02,
        filter: "blur(10px)",
        transition: {
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1]
        }
    }
};

export default function PageTransition({ children, className }: PageTransitionProps) {
    return (
        <motion.div
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={className}
        >
            {children}
        </motion.div>
    );
}
