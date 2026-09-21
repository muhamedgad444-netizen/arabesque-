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
          <svg
            viewBox="0 0 355 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto block"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8 22H52C67.464 22 80 34.536 80 50C80 65.464 67.464 78 52 78H32V104H8V22ZM32 58H50C54.4183 58 58 54.4183 58 50C58 45.5817 54.4183 42 50 42H32V58Z"
              fill="white"
            />
            <path
              d="M88 40H110V49.5C114.5 43.5 122 39.5 131 40V62C128.5 61.5 125.5 61.5 122.5 62C115 63 110 68 110 77V104H88V40Z"
              fill="white"
            />
            <path
              d="M138 40H159V49.2C163.5 43.2 170.8 39.5 179 39.5C187.5 39.5 194.2 43.8 197.8 50.8C203 43.5 210.8 39.5 220 39.5C234.5 39.5 244 48.8 244 64.5V104H222V68C222 59.5 217.5 56 211 56C204 56 199 61 199 70V104H177V68C177 59.5 172.5 56 166 56C159 56 154 61 154 70V104H138V40Z"
              fill="white"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M252 40H286C298.5 40 308 49.5 308 62C308 74.5 298.5 84 286 84H270V104H252V40ZM270 68H284C287.5 68 290 65.5 290 62C290 58.5 287.5 56 284 56H270V68Z"
              fill="white"
            />
            <path
              d="M316 26H334V40H346V56H334V85C334 89 336 91 340 91H346V104C343 104.5 338 105 332 105C320 105 316 97.5 316 86V56H308V40H316V26Z"
              fill="white"
            />
            <circle
              cx="345"
              cy="15"
              r="8"
              stroke="white"
              strokeWidth="1.75"
              fill="none"
            />
            <text
              x="345"
              y="18.5"
              fill="white"
              fontSize="8.5"
              fontFamily="Inter Tight, sans-serif"
              fontWeight="600"
              textAnchor="middle"
            >
              R
            </text>
          </svg>
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
