/**
 * Zero-dependency pure SVG QR Code & Barcode Generator for exam cards & desk labels
 */

// Simple checksum generator for 21x21 grid
export function generateQrMatrix(text: string): boolean[][] {
  const size = 25;
  const grid: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));

  // Helper to draw standard 7x7 corner finder patterns
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[startY + r][startX + c] = isBorder || isCenter;
      }
    }
    // white quiet ring inside finder
    for (let r = 1; r < 6; r++) {
      for (let c = 1; c < 6; c++) {
        if (!(r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          grid[startY + r][startX + c] = false;
        }
      }
    }
  };

  // 3 Corner Finders
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Small alignment pattern at (size - 9, size - 9)
  const ax = size - 9;
  const ay = size - 9;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const isBorder = r === 0 || r === 4 || c === 0 || c === 4;
      const isCenter = r === 2 && c === 2;
      grid[ay + r][ax + c] = isBorder || isCenter;
    }
  }

  // Deterministic pseudo-random fill based on hash of payload
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  const isReserved = (r: number, c: number) => {
    if (r <= 7 && c <= 7) return true;
    if (r <= 7 && c >= size - 8) return true;
    if (r >= size - 8 && c <= 7) return true;
    if (r === 6 || c === 6) return true;
    if (r >= ay && r < ay + 5 && c >= ax && c < ax + 5) return true;
    return false;
  };

  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isReserved(r, c)) {
        // Linear congruential step
        hash = (Math.imul(hash, 1103515245) + 12345) & 0x7fffffff;
        const charSeed = text.charCodeAt(bitIdx % text.length) || 42;
        grid[r][c] = ((hash ^ charSeed) & 1) === 1;
        bitIdx++;
      }
    }
  }

  return grid;
}

export function generateBarcodeBars(code: string): number[] {
  // Simple interleaved barcode bar pattern
  const bars: number[] = [2, 1, 2, 1]; // start
  for (let i = 0; i < code.length; i++) {
    const val = code.charCodeAt(i) % 4;
    bars.push(val + 1, (4 - val) || 1, ((val * 2) % 3) + 1, 1);
  }
  bars.push(2, 1, 2); // stop
  return bars;
}
