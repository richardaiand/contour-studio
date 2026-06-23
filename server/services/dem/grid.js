/**
 * Resample a grid to a target width/height using simple nearest-neighbor sampling.
 * @param {number[][]} grid
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @returns {number[][]}
 */
export function resampleGrid(grid, targetWidth, targetHeight) {
  const sourceHeight = grid.length;
  const sourceWidth = grid[0]?.length || 0;

  if (sourceWidth === 0 || sourceHeight === 0) {
    throw new Error('Cannot resample empty grid');
  }

  if (sourceWidth === targetWidth && sourceHeight === targetHeight) {
    return grid;
  }

  const output = [];
  for (let y = 0; y < targetHeight; y++) {
    const row = [];
    const sy = Math.min(sourceHeight - 1, Math.round((y / Math.max(1, targetHeight - 1)) * (sourceHeight - 1)));
    for (let x = 0; x < targetWidth; x++) {
      const sx = Math.min(sourceWidth - 1, Math.round((x / Math.max(1, targetWidth - 1)) * (sourceWidth - 1)));
      row.push(grid[sy][sx]);
    }
    output.push(row);
  }

  return output;
}
