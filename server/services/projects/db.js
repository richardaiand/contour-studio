import { getDb, generateId } from '../../db.js';
import { now } from '../../utils/index.js';

export function createProjectFromJob(job, dem, mesh) {
  const db = getDb();
  const id = generateId();
  const createdAt = now();

  const center = {
    lat: (job.payload.bounds.minLat + job.payload.bounds.maxLat) / 2,
    lon: (job.payload.bounds.minLon + job.payload.bounds.maxLon) / 2,
  };

  const title = generateTitle(center, job.payload.detailLevel);

  db.prepare(
    `INSERT INTO projects (id, user_id, title, detail_level, bounds_json, center_json, source_info_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    job.userId,
    title,
    job.payload.detailLevel,
    JSON.stringify(job.payload.bounds),
    JSON.stringify(center),
    JSON.stringify({
      sources: dem.sources,
      attribution: dem.attribution,
      resolutionMeters: dem.resolutionMeters,
      verticalExaggeration: job.payload.verticalExaggeration,
      minElevation: mesh.minElevation,
      maxElevation: mesh.maxElevation,
    }),
    createdAt,
    createdAt
  );

  return id;
}

export function recordExport({ userId, projectId, format, filename, sizeBytes }) {
  const db = getDb();
  const id = generateId();
  db.prepare(
    `INSERT INTO exports (id, user_id, project_id, format, filename, size_bytes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, projectId || null, format, filename, sizeBytes || 0, now());
  return id;
}

function generateTitle(center, detailLevel) {
  const level = detailLevel ? detailLevel[0].toUpperCase() + detailLevel.slice(1) : 'Terrain';
  const latDir = center.lat >= 0 ? 'N' : 'S';
  const lonDir = center.lon >= 0 ? 'E' : 'W';
  return `${level} · ${Math.abs(center.lat).toFixed(4)}°${latDir}, ${Math.abs(center.lon).toFixed(4)}°${lonDir}`;
}
