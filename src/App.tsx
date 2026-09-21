import React, { useEffect, useRef, useState, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import { CustomCursor } from "./components/CustomCursor";
import { HeaderNav } from "./components/HeaderNav";
import { HeroVideo } from "./components/HeroVideo";
import { GalleryPanel } from "./components/GalleryPanel";
import { OutroOverlay } from "./components/OutroOverlay";
import Products from "./components/products/Products";
import About from "./components/About/About";
import Iteams from "./components/Items/Iteams";
const Home: React.FC = () => {
  const [cols, setCols] = useState<number>(4);

  const spacerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const innerWrapRef = useRef<HTMLDivElement | null>(null);

  const updateCols = useCallback(() => {
    const width = window.innerWidth;
    if (width < 640) {
      setCols(2);
    } else if (width < 1024) {
      setCols(3);
    } else {
      setCols(4);
    }
  }, []);

  useEffect(() => {
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => {
      window.removeEventListener("resize", updateCols);
    };
  }, [updateCols]);

  useEffect(() => {
    let animationFrameId: number;
    let cachedVh = window.innerHeight;
    let cachedMaxScroll = 0;

    const outroOverlayEl = document.getElementById("outro-overlay");
    const outroInfoEl = document.getElementById("outro-info");
    const outroBuyEl = document.getElementById("outro-buy");
    const outroFooterEl = document.getElementById("outro-footer");
    const mainCanvasEl = document.getElementById("main-canvas");

    let videoIsVisible = true;

    let cachedCards: HTMLElement[] = [];
    const refreshCards = () => {
      cachedCards = Array.from(
        document.querySelectorAll<HTMLElement>(".bp-card"),
      );
    };
    const cardCacheTimer = setTimeout(refreshCards, 100);

    const updateDimensions = () => {
      cachedVh = window.innerHeight;
      if (innerWrapRef.current && spacerRef.current) {
        const wrapHeight = innerWrapRef.current.offsetHeight;
        cachedMaxScroll = Math.max(0, wrapHeight - cachedVh);
        const totalHeight = cachedVh + cachedMaxScroll + 2 * cachedVh;
        spacerRef.current.style.height = `${totalHeight}px`;
        refreshCards();
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (innerWrapRef.current) {
      resizeObserver.observe(innerWrapRef.current);
    }
    window.addEventListener("resize", updateDimensions);

    const tick = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const vh = cachedVh;
      const maxScroll = cachedMaxScroll;
      const isDesktop = window.innerWidth >= 1024;
      const outroOffset = isDesktop ? 166 : 132;

      const shouldBeVisible = scrollY < vh;
      if (shouldBeVisible !== videoIsVisible) {
        videoIsVisible = shouldBeVisible;
        if (mainCanvasEl) {
          mainCanvasEl.style.visibility = shouldBeVisible
            ? "visible"
            : "hidden";
        }
      }

      if (panelRef.current && innerWrapRef.current) {
        if (scrollY <= vh) {
          const panelY = vh - scrollY;
          panelRef.current.style.transform = `translate3d(0, ${panelY}px, 0)`;
          innerWrapRef.current.style.transform = "translate3d(0, 0px, 0)";
        } else if (scrollY <= vh + maxScroll) {
          panelRef.current.style.transform = "translate3d(0, 0px, 0)";
          const innerOffset = scrollY - vh;
          innerWrapRef.current.style.transform = `translate3d(0, -${innerOffset}px, 0)`;
        } else {
          panelRef.current.style.transform = "translate3d(0, 0px, 0)";
          innerWrapRef.current.style.transform = `translate3d(0, -${maxScroll}px, 0)`;
        }
      }

      const outroStart = vh + maxScroll;
      const outroDist = Math.max(0, scrollY - outroStart);
      const outroRange = Math.max(1, vh - 100);
      const outroProgress = Math.min(1, Math.max(0, outroDist / outroRange));

      if (outroOverlayEl) {
        outroOverlayEl.style.opacity = `${outroProgress}`;
      }
      if (outroInfoEl) {
        outroInfoEl.style.transform = `translate3d(0, ${-outroProgress * outroOffset}px, 0)`;
      }
      if (outroBuyEl) {
        outroBuyEl.style.transform = `scale(${outroProgress})`;
      }
      if (outroFooterEl) {
        outroFooterEl.style.opacity = `${outroProgress}`;
      }

      const enterThreshold = vh * 0.6;
      const exitThreshold = vh * 0.4;

      for (let i = 0; i < cachedCards.length; i++) {
        const card = cachedCards[i];
        const rect = card.getBoundingClientRect();
        const top = rect.top;
        const bottom = rect.bottom;

        if (bottom <= 0 || top >= vh) {
          card.style.transform = "scale(0)";
        } else {
          const enter = (vh - top) / enterThreshold;
          const exit = bottom / exitThreshold;
          const scale = Math.max(0, Math.min(1, Math.min(enter, exit)));
          card.style.transform = `scale(${scale.toFixed(4)})`;
        }
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      clearTimeout(cardCacheTimer);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateDimensions);
      resizeObserver.disconnect();
    };
  }, [cols]);

  return (
    <div
      id="scroll-spacer"
      ref={spacerRef}
      className="relative select-none bg-white w-full min-h-[500vh]"
    >
      <HeaderNav />
      <HeroVideo />
      <GalleryPanel
        cols={cols}
        innerWrapRef={innerWrapRef}
        panelRef={panelRef}
      />
      <OutroOverlay />
    </div>
  );
};

const ProductsPage: React.FC = () => {
  return <Products />;
};

const AboutPage: React.FC = () => {
  return <About />;
};
export const App: React.FC = () => {
  return (
    <>
      <CustomCursor />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/cart" element={<Iteams />} />
      </Routes>
    </>
  );
};

export default App;
