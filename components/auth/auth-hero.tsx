"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
    staggerContainer,
    slideUp,
    scaleIn,
    floatAnimation,
    floatAnimationDelayed,
    floatAnimationSlow,
} from "@/lib/animation/animations";

type AuthHeroProps = {
    variant: "regular" | "ncvet";
};

const heroImages = {
    regular: [
        "/images/hero-1.jpg",
        "/images/hero-4.jpg",
        "/images/hero-3.jpg",
        "/images/hero-2.jpg",
    ],
    ncvet: [
        "/images/ncvet-hero1.jpg",
        "/images/ncvet-hero2.jpg",
        "/images/ncvet-hero3.jpg",
        "/images/ncvet-hero4.png",
    ],
};

const heroContent = {
    regular: {
        badge: "Free Certification Program",
        titleBefore: "Build Your Career in",
        titleHighlight: "Supply Chain",
        description:
            "6 days classroom training plus 45 days paid on-the-job training with one of India’s leading e-commerce companies.",
        stats: [
            { value: "90,000+", label: "Trained Learners" },
            { value: "51", label: "Cities Covered" },
            { value: "Free", label: "Certification" },
        ],
    },
    ncvet: {
        badge: "NCVET Candidate Portal",
        titleBefore: "Start Your Verified",
        titleHighlight: "Learning Journey",
        description:
            "Access your structured certification journey, learner verification flow, and training support through the NCVET pathway.",
        stats: [
            { value: "Verified", label: "Candidate Flow" },
            { value: "Secure", label: "OTP Access" },
            { value: "Guided", label: "Enrollment Process" },
        ],
    },
} as const;

export default function AuthHero({ variant }: AuthHeroProps) {
    const content = heroContent[variant];
    const images = heroImages[variant];

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="hidden lg:flex flex-col gap-0 relative -mt-2 lg:-mt-4"
        >
            <motion.div variants={slideUp} className="mb-8">
                <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    {content.badge}
                </span>

                <h1 className="mt-4 text-4xl font-bold leading-tight text-foreground xl:text-5xl">
                    {content.titleBefore}{" "}
                    <span className="text-primary">{content.titleHighlight}</span>
                </h1>

                <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
                    {content.description}
                </p>
            </motion.div>

            <div className="relative h-85 lg:h-105">

                <motion.div
                    variants={scaleIn}
                    animate={floatAnimation}
                    className="absolute left-0 top-0 w-[55%] rounded-2xl overflow-hidden border border-border bg-background shadow-lg"
                >
                    <Image src={images[0]} width={400} height={280} alt="Hero image 1" className="w-full h-65 object-cover" />
                </motion.div>

                <motion.div
                    variants={scaleIn}
                    animate={floatAnimationDelayed}
                    className="absolute right-0 top-4 w-[42%] rounded-2xl overflow-hidden border border-border bg-background shadow-lg"
                >
                    <Image src={images[1]} width={300} height={200} alt="Hero image 2" className="w-full h-47 object-cover" />
                </motion.div>

                <motion.div
                    variants={scaleIn}
                    animate={floatAnimationSlow}
                    className="absolute right-4 bottom-0 w-[52%] rounded-2xl overflow-hidden border border-border bg-background shadow-lg"
                >
                    <Image src={images[2]} width={350} height={220} alt="Hero image 3" className="w-full h-53 object-cover" />
                </motion.div>

                <motion.div
                    variants={scaleIn}
                    animate={{
                        y: [0, -6, 0],
                        transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 },
                    }}
                    className="absolute left-8 bottom-2 w-[36%] rounded-2xl overflow-hidden border border-border bg-background shadow-lg"
                >
                    <Image src={images[3]} width={240} height={160} alt="Hero image 4" className="w-full h-37 object-cover" />
                </motion.div>

            </div>

            <motion.div variants={slideUp} className="mt-6 flex items-center gap-6">
                {content.stats.map((stat) => (
                    <div key={stat.label} className="flex flex-col">
                        <span className="text-2xl font-bold text-primary">{stat.value}</span>
                        <span className="text-xs text-muted">{stat.label}</span>
                    </div>
                ))}
            </motion.div>
        </motion.div>
    );
}