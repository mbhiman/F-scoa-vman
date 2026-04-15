import type { Variants, TargetAndTransition } from "framer-motion";

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.6, ease: "easeOut" },
    },
};

export const slideUp: Variants = {
    hidden: { opacity: 0, y: 28 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

export const slideDown: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: "easeOut" },
    },
};

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.93 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
    },
};

export const staggerContainer: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.11,
            delayChildren: 0.1,
        },
    },
};

export const floatAnimation: TargetAndTransition = {
    y: [0, -14, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
};

export const floatAnimationDelayed: TargetAndTransition = {
    y: [0, -10, 0],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
};

export const floatAnimationSlow: TargetAndTransition = {
    y: [0, -8, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
};

export const buttonHover = {
    scale: 1.03,
    transition: { duration: 0.15 },
};

export const buttonTap = {
    scale: 0.97,
};