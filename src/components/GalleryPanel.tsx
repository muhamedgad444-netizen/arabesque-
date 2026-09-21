import React, { useMemo } from 'react';
import { GALLERY_IMAGES } from '../constants';
import type { GridCell } from '../types';

interface GalleryPanelProps {
  cols: number;
  innerWrapRef: React.RefObject<HTMLDivElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
}

export const buildLayout = (count: number, cols: number): GridCell[][] => {
  const rows: GridCell[][] = [];
  let currentImageIdx = 0;
  let r = 0;

  while (currentImageIdx < count) {
    const row: GridCell[] = Array.from({ length: cols }, (_, c) => ({
      imageIndex: -1,
      colIndex: c,
      rowIndex: r,
    }));

    // Primary column
    const a = (r * 2 + (r % 2)) % cols;
    if (currentImageIdx < count) {
      row[a] = { imageIndex: currentImageIdx, colIndex: a, rowIndex: r };
      currentImageIdx++;
    }

    // Every 3rd row (r % 3 === 0), place a second image
    if (r % 3 === 0 && currentImageIdx < count) {
      let b = (a + 2) % cols;
      if (b === a) {
        b = (a + 1) % cols;
      }
      row[b] = { imageIndex: currentImageIdx, colIndex: b, rowIndex: r };
      currentImageIdx++;
    }

    rows.push(row);
    r++;
  }

  return rows;
};

export const GalleryPanel: React.FC<GalleryPanelProps> = ({
  cols,
  innerWrapRef,
  panelRef,
}) => {
  const gridRows = useMemo(
    () => buildLayout(GALLERY_IMAGES.length, cols),
    [cols]
  );

  return (
    <div
      ref={panelRef}
      id="black-panel"
      className="fixed inset-0 bg-black overflow-hidden pointer-events-none"
      style={{
        zIndex: 10,
        transform: 'translate3d(0, 100vh, 0)',
        willChange: 'transform',
      }}
    >
      {/* Inner scrolling wrapper */}
      <div
        ref={innerWrapRef}
        id="gallery-inner-wrap"
        className="w-full relative px-4 lg:px-8 pb-32"
        style={{
          paddingTop: 'min(400px, 40vh)',
          willChange: 'transform',
        }}
      >
        <div
          className="grid w-full gap-4 sm:gap-6 lg:gap-8"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {gridRows.map((row, rIdx) => (
            <React.Fragment key={`row-${rIdx}`}>
              {row.map((cell, cIdx) => {
                if (cell.imageIndex === -1) {
                  return (
                    <div
                      key={`empty-${rIdx}-${cIdx}`}
                      className="w-full aspect-[10/23] pointer-events-none"
                    />
                  );
                }

                const isLeftHalf = cIdx < cols / 2;
                const transformOrigin = isLeftHalf
                  ? 'right bottom'
                  : 'left bottom';

                return (
                  <div
                    key={`card-${cell.imageIndex}`}
                    className="bp-card w-full aspect-[10/23] relative overflow-hidden bg-zinc-900"
                    data-card-index={cell.imageIndex}
                    data-col={cIdx}
                    style={{
                      transformOrigin,
                      transform: 'scale(0)',
                      willChange: 'transform',
                    }}
                  >
                    <img
                      src={GALLERY_IMAGES[cell.imageIndex]}
                      alt={`arabesque product ${cell.imageIndex + 1}`}
                      loading="eager"
                      className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none block"
                    />
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
