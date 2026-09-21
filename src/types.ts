export interface GridCell {
  imageIndex: number; // -1 if empty spacer, or index into GALLERY_IMAGES
  colIndex: number;
  rowIndex: number;
}

export type ActiveVideoSide = 'left' | 'right' | null;

export interface ScrollState {
  scrollY: number;
  vh: number;
  maxScroll: number;
  phase: 1 | 2 | 3; // 1: Hero to Gallery transition, 2: Gallery scroll, 3: Outro
  outroProgress: number;
}
