import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { SYMBOLS } from '../constants';

const easeCustom = [0.25, 0.1, 0.25, 1] as const;

export const OutroOverlay: React.FC = () => {
  const [currentSymbol, setCurrentSymbol] = useState<string>('8');
  const lastThrottleRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastThrottleRef.current > 80) {
        lastThrottleRef.current = now;
        const randomIndex = Math.floor(Math.random() * SYMBOLS.length);
        setCurrentSymbol(SYMBOLS[randomIndex]);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {/* 1I. White Overlay */}
      <div
        id="outro-overlay"
        className="fixed inset-0 pointer-events-none bg-white transition-none"
        style={{
          zIndex: 12,
          opacity: 0,
        }}
        aria-hidden="true"
      />

      {/* 1E. Product Info (Bottom Right) */}
      <motion.div
        id="outro-info"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeCustom, delay: 0.45 }}
        data-outro-offset="166"
        className="fixed pointer-events-none z-20 flex flex-col items-center
          left-0 right-0 bottom-12 lg:left-auto lg:right-8 lg:bottom-20 lg:w-[330px]"
        style={{
          mixBlendMode: 'exclusion',
          transformOrigin: 'right bottom',
        }}
      >
        {/* Top block */}
        <div className="flex flex-col items-start w-[252px] lg:w-full mb-3 lg:mb-8">
          {/* Circle Icon */}
          <div className="relative w-5 h-5 lg:w-[30px] lg:h-[30px] flex items-center justify-center mb-1">
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full block"
            >
              <circle
                cx="20"
                cy="20"
                r="18.75"
                stroke="white"
                strokeWidth="2.5"
                className="stroke-[2px] lg:stroke-[2.5px]"
                fill="none"
              />
            </svg>
            <span
              id="circle-symbol"
              className="absolute inset-0 flex items-center justify-center font-['Inter_Tight'] font-medium text-[10px] lg:text-[15px] uppercase tracking-[-0.04em] text-white"
            >
              {currentSymbol}
            </span>
          </div>

          {/* Collection Label */}
          <h2 className="w-full font-['Inter_Tight'] font-medium text-[20px] lg:text-[30px] leading-none text-center tracking-[-0.04em] uppercase text-white whitespace-pre-line">
            ARCHIVE COLLECTION{'\n'}"ARABESQUE"
          </h2>
        </div>

        {/* Price */}
        <div className="w-full font-['Inter_Tight'] font-medium text-[60px] lg:text-[80px] leading-none text-center tracking-[-0.04em] text-white">
          $97,33
        </div>
      </motion.div>

      {/* 1F. "View" Button (Bottom Right, Initially Hidden) */}
      <NavLink
        to="/products"
        id="outro-buy"
        className="fixed pointer-events-auto z-20 flex items-center justify-center bg-white rounded-[1335px]
          left-4 right-4 bottom-[60px] h-[100px]
          lg:left-auto lg:right-8 lg:bottom-8 lg:w-[330px] lg:h-[174px]"
        style={{
          mixBlendMode: 'exclusion',
          transformOrigin: 'right bottom',
          transform: 'scale(0)',
          textDecoration: 'none'
        }}
      >
        <span
          className="font-['Inter_Tight'] font-medium text-[72px] lg:text-[110px] tracking-[-0.04em] text-white select-none"
          style={{ mixBlendMode: 'exclusion' }}
        >
          view
        </span>
      </NavLink>

      {/* 1J. Footer */}
      <footer
        id="outro-footer"
        className="fixed pointer-events-none left-4 right-4 lg:right-auto bottom-6 lg:bottom-8 lg:left-4
          flex items-center justify-between lg:justify-start lg:gap-20 text-white"
        style={{
          mixBlendMode: 'exclusion',
          zIndex: 20,
          opacity: 0,
        }}
      >
        <span className="font-['Inter_Tight'] font-medium text-[13px] lg:text-[14px] tracking-[-0.02em] uppercase">
          ARABESQUE (R) 2026
        </span>
        <span className="font-['Inter_Tight'] font-medium text-[13px] lg:text-[14px] tracking-[-0.02em] uppercase">
          PRIVACY POLICY
        </span>
      </footer>
    </>
  );
};
