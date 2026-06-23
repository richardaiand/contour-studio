import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resampleGrid } from '../server/services/dem/grid.js';

describe('resampleGrid', () => {
  it('downsamples a grid', () => {
    const grid = [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 9, 10, 11],
      [12, 13, 14, 15],
    ];

    const result = resampleGrid(grid, 2, 2);

    assert.equal(result.length, 2);
    assert.equal(result[0].length, 2);
    assert.equal(result[1][1], 15);
  });

  it('returns identical grid when sizes match', () => {
    const grid = [[1, 2], [3, 4]];
    const result = resampleGrid(grid, 2, 2);
    assert.deepEqual(result, grid);
  });

  it('throws for empty grid', () => {
    assert.throws(() => resampleGrid([], 2, 2));
  });
});
