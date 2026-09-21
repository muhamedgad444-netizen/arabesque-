import React, { useEffect, useRef, useState } from 'react';
import { HERO_VIDEO_URL, VIDEO_LEFT_URL, VIDEO_RIGHT_URL } from '../constants';
import type { ActiveVideoSide } from '../types';

interface HeroVideoProps {}

export const HeroVideo: React.FC<HeroVideoProps> = () => {
  const isSingleVideo = VIDEO_LEFT_URL === VIDEO_RIGHT_URL;
  const singleVideoRef = useRef<HTMLVideoElement | null>(null);
  const leftVideoRef = useRef<HTMLVideoElement | null>(null);
  const rightVideoRef = useRef<HTMLVideoElement | null>(null);
  const cursorXRef = useRef<number | null>(null);
  const activeSideRef = useRef<ActiveVideoSide>('right');
  const [isLoaded, setIsLoaded] = useState<{ left: boolean; right: boolean; single: boolean }>({
    left: false,
    right: false,
    single: false,
  });

  const isReady = isSingleVideo ? isLoaded.single : (isLoaded.left && isLoaded.right);

  useEffect(() => {
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth < 1024;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Single video mode
    if (isSingleVideo) {
      const vid = singleVideoRef.current;
      if (!vid) return;

      if (isTouch) {
        if (prefersReducedMotion) {
          vid.pause();
          vid.currentTime = 0;
        } else {
          vid.loop = true;
          vid.play().catch(() => {});
        }
        return;
      }

      // Desktop: dead-zone scrubbing — mirrors original dual-video behavior
      // - Center dead zone → stay at currentTime = 0 (first frame / resting pose)
      // - Cursor left of dead zone → scrub first half of video (0 → duration/2)
      // - Cursor right of dead zone → scrub second half of video (0 → duration/2)
      // Both sides radiate outward from 0 so the animation feels symmetrical
      const onMouseMove = (e: MouseEvent) => {
        cursorXRef.current = e.clientX;
      };

      window.addEventListener('mousemove', onMouseMove, { passive: true });

      let animationFrameId: number;
      const renderLoop = () => {
        if (cursorXRef.current !== null && vid) {
          const width = window.innerWidth;
          const cursorX = cursorXRef.current;

          // Full-range scrub: cursor at left edge = frame 0, right edge = last frame
          const progress = Math.min(1, Math.max(0, cursorX / width));

          if (vid.duration && !vid.seeking && Number.isFinite(vid.duration)) {
            const targetTime = progress * vid.duration;
            if (Math.abs(vid.currentTime - targetTime) > 0.02) {
              vid.currentTime = targetTime;
            }
          }
        }
        animationFrameId = requestAnimationFrame(renderLoop);
      };

      animationFrameId = requestAnimationFrame(renderLoop);

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        cancelAnimationFrame(animationFrameId);
      };
    }

    // Dual video mode
    const leftVid = leftVideoRef.current;
    const rightVid = rightVideoRef.current;
    if (!leftVid || !rightVid) return;

    if (isTouch) {
      let isCancelled = false;

      if (prefersReducedMotion) {
        rightVid.style.display = 'block';
        leftVid.style.display = 'none';
        return;
      }

      const playLeft = () => {
        if (isCancelled || !leftVid || !rightVid) return;
        rightVid.pause();
        rightVid.style.display = 'none';
        leftVid.style.display = 'block';
        leftVid.currentTime = 0;
        leftVid.play().catch(() => {});
      };

      const playRight = () => {
        if (isCancelled || !leftVid || !rightVid) return;
        leftVid.pause();
        leftVid.style.display = 'none';
        rightVid.style.display = 'block';
        rightVid.currentTime = 0;
        rightVid.play().catch(() => {});
      };

      leftVid.addEventListener('ended', playRight);
      rightVid.addEventListener('ended', playLeft);

      playLeft();

      return () => {
        isCancelled = true;
        leftVid.removeEventListener('ended', playRight);
        rightVid.removeEventListener('ended', playLeft);
      };
    }

    // Desktop dual video scrubbing
    const onMouseMove = (e: MouseEvent) => {
      cursorXRef.current = e.clientX;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    let animationFrameId: number;

    const renderLoop = () => {
      if (cursorXRef.current !== null) {
        const width = window.innerWidth;
        const centerX = width / 2;
        const deadZone = Math.max(30, width * 0.05);
        const cursorX = cursorXRef.current;

        const isInsideDeadZone =
          cursorX >= centerX - deadZone && cursorX <= centerX + deadZone;

        if (isInsideDeadZone) {
          if (leftVid && !leftVid.seeking && leftVid.currentTime !== 0) {
            leftVid.currentTime = 0;
          }
          if (rightVid && !rightVid.seeking && rightVid.currentTime !== 0) {
            rightVid.currentTime = 0;
          }

          if (activeSideRef.current === 'left') {
            leftVid.style.display = 'block';
            rightVid.style.display = 'none';
          } else {
            leftVid.style.display = 'none';
            rightVid.style.display = 'block';
          }
        } else if (cursorX < centerX - deadZone) {
          activeSideRef.current = 'right';
          leftVid.style.display = 'none';
          rightVid.style.display = 'block';

          const availableRange = centerX - deadZone;
          const distFromDeadZone = centerX - deadZone - cursorX;
          const progress = Math.min(
            1,
            Math.max(0, distFromDeadZone / availableRange)
          );

          if (
            rightVid.duration &&
            !rightVid.seeking &&
            Number.isFinite(rightVid.duration)
          ) {
            const targetTime = progress * rightVid.duration;
            if (Math.abs(rightVid.currentTime - targetTime) > 0.02) {
              rightVid.currentTime = targetTime;
            }
          }
        } else {
          activeSideRef.current = 'left';
          leftVid.style.display = 'block';
          rightVid.style.display = 'none';

          const availableRange = width - (centerX + deadZone);
          const distFromDeadZone = cursorX - (centerX + deadZone);
          const progress = Math.min(
            1,
            Math.max(0, distFromDeadZone / availableRange)
          );

          if (
            leftVid.duration &&
            !leftVid.seeking &&
            Number.isFinite(leftVid.duration)
          ) {
            const targetTime = progress * leftVid.duration;
            if (Math.abs(leftVid.currentTime - targetTime) > 0.02) {
              leftVid.currentTime = targetTime;
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSingleVideo]);

  return (
    <div
      id="main-canvas"
      className="pointer-events-none overflow-hidden transition-opacity duration-300 ease-out"
      style={{
        position: 'fixed',
        zIndex: 0,
        opacity: isReady ? 1 : 0,
        visibility: 'visible',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <div className="relative w-full h-full lg:static">
        <div className="absolute lg:inset-0 top-[220px] left-0 w-full h-[calc(100vh-220px)] lg:h-full lg:w-full">
          {isSingleVideo ? (
            <video
              ref={singleVideoRef}
              src={HERO_VIDEO_URL}
              muted
              playsInline
              preload="auto"
              onLoadedData={() =>
                setIsLoaded((prev) => ({ ...prev, single: true }))
              }
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              {/* Left Video */}
              <video
                ref={leftVideoRef}
                src={VIDEO_LEFT_URL}
                muted
                playsInline
                preload="auto"
                onLoadedData={() =>
                  setIsLoaded((prev) => ({ ...prev, left: true }))
                }
                className="absolute inset-0 w-full h-full object-cover"
                style={{ display: 'none' }}
              />

              {/* Right Video (starts displayed) */}
              <video
                ref={rightVideoRef}
                src={VIDEO_RIGHT_URL}
                muted
                playsInline
                preload="auto"
                onLoadedData={() =>
                  setIsLoaded((prev) => ({ ...prev, right: true }))
                }
                className="absolute inset-0 w-full h-full object-cover"
                style={{ display: 'block' }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
