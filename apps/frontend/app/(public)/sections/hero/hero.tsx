'use client';

import { ArrowUpRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { motion } from 'framer-motion';
import StatSection from './stat-section';
import UglyTextWrapper from '@/components/ugly-text-wrapper';
import {
  fadeUp,
  scaleIn,
  staggerContainer,
  viewportOnce,
} from '../section-motion';

export default function Hero() {
  return (
    <section className="bg-bg-brand-solid-alt">
      <div className="max-w-[1280px] mx-auto px-spacing-5xl py-spacing-10xl text-white flex flex-col gap-y-spacing-8xl">
        <motion.div
          className="flex flex-col gap-y-spacing-5xl items-center justify-center text-center "
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <motion.span
            variants={scaleIn}
            className=" min-h-9 py-spacing-lg sm:h-9 bg-[#510424] rounded-full px-spacing-3xl flex justify-center items-center gap-spacing-sm text-label-xs md:text-label-sm font-label-sm-strong! text-text-brand-tertiary"
          >
            <Sparkles className="w-4 h-4" />
            Powered by Alice AI. Designed for people.
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="text-heading-lg md:text-heading-2xl font-heading-2xl-strong! text-white max-w-[860px]"
          >
            The smarter way to find and hire local talent
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-body-sm md:text-body-md text-text-gray-quinary max-w-[768px]"
          >
            AI-driven recruitment built for local employers and jobseekers.
            Faster hiring. Better matches. Shared values. Recruit Local connects
            communities using intelligent matching — helping the right people
            find the right opportunities close to home.
          </motion.p>
          <motion.div variants={scaleIn}>
            <Link
              href="/login"
              className="text-label-md rounded-full font-label-md-strong! flex items-center h-12 justify-center gap-spacing-xs py-spacing-xl px-spacing-3xl bg-bg-brand-solid-primary"
            >
              <UglyTextWrapper> Start Hiring Experts </UglyTextWrapper>
              <ArrowUpRight />
            </Link>
          </motion.div>
        </motion.div>
        <div>
          <StatSection />
        </div>
      </div>
    </section>
  );
}
