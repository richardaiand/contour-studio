import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { exportMesh } from '../server/services/terrain/exporter.js';

function makeMesh() {
  return {
    width: 2,
    height: 2,
    grid: [[0, 10], [5, 15]],
    positions: [
      0, 0, 0,
      1, 10, 0,
      0, 5, 1,
      1, 15, 1,
    ],
    normals: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    uvs: [0, 0, 1, 0, 0, 1, 1, 1],
    colors: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
    indices: [0, 2, 1, 1, 2, 3],
    minElevation: 0,
    maxElevation: 15,
  };
}

describe('exportMesh', () => {
  it('exports OBJ as text', () => {
    const result = exportMesh(makeMesh(), 'obj', 'test');
    assert.equal(result.filename, 'test.obj');
    assert.equal(result.type, 'text/plain');
    assert.ok(typeof result.data === 'string');
    assert.ok(result.data.includes('v '));
    assert.ok(result.data.includes('f '));
  });

  it('exports STL as binary buffer', () => {
    const result = exportMesh(makeMesh(), 'stl', 'test');
    assert.equal(result.filename, 'test.stl');
    assert.equal(result.type, 'application/octet-stream');
    assert.ok(Buffer.isBuffer(result.data));
    assert.ok(result.data.length > 84);
  });

  it('exports heightmap as PNG buffer', () => {
    const result = exportMesh(makeMesh(), 'heightmap', 'test');
    assert.equal(result.filename, 'test.png');
    assert.equal(result.type, 'image/png');
    assert.ok(Buffer.isBuffer(result.data));
    assert.ok(result.data.length > 0);
  });
});
