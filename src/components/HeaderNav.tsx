import React from 'react';
import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

const easeCustom = [0.25, 0.1, 0.25, 1] as const;

export const HeaderNav: React.FC = () => {
  const totalItems = useCartStore((s) => s.getTotalItems());

  return (
    <>
      {/* Logo (Top Left) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeCustom, delay: 0 }}
        className="fixed z-20 top-4 left-4 lg:top-6 lg:left-6 w-[96px] sm:w-[180px] lg:w-[240px]"
        style={{ mixBlendMode: 'exclusion' }}
      >
        <NavLink to="/" className="pointer-events-auto block">
          <span className="font-['Inter_Tight'] font-bold text-[24px] sm:text-[32px] lg:text-[40px] tracking-[-0.04em] text-white">
            ARABESQUE
            <sup className="text-[10px] sm:text-[12px] ml-1 font-semibold border border-white rounded-full px-[3px] py-[1px] relative -top-3 sm:-top-4">R</sup>
          </span>
        </NavLink>
      </motion.div>

      {/* Header Navigation (Top Right) */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeCustom, delay: 0.15 }}
        className="fixed z-20 top-4 right-4 lg:top-6 lg:right-6 h-[26px] w-auto lg:w-[420px] flex items-center justify-end lg:justify-between text-white"
        style={{ mixBlendMode: 'exclusion' }}
      >
        <span className="hidden lg:inline-block pointer-events-none font-['Inter_Tight'] font-medium text-[14px] uppercase tracking-normal">
          MENU
        </span>

        <div className="flex items-center gap-4 lg:gap-8 pointer-events-auto">
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 lg:w-6 lg:h-6 pointer-events-none"
          >
            <path d="M0 14H40" stroke="white" strokeWidth="2.5" />
            <path d="M0 26H40" stroke="white" strokeWidth="2.5" />
          </svg>

          <NavLink
            to="/about"
            className="font-['Inter_Tight'] font-medium text-[13px] lg:text-[14px] uppercase no-underline text-white"
          >
            [ ABOUT ]
          </NavLink>

          <NavLink
            to="/products"
            className="font-['Inter_Tight'] font-medium text-[13px] lg:text-[14px] uppercase no-underline text-white"
          >
            [ PRODUCTS ]
          </NavLink>

          <NavLink
            to="/cart"
            className="font-['Inter_Tight'] font-medium text-[13px] lg:text-[14px] uppercase no-underline text-white"
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            [ CART ]
            {totalItems > 0 && (
              <span style={{
                background: '#635bff',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                lineHeight: 1,
                padding: '2px 5px',
                borderRadius: '999px',
                verticalAlign: 'middle',
              }}>
                {totalItems}
              </span>
            )}
          </NavLink>
        </div>
      </motion.header>
    </>
  );
};
