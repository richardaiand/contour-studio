import { getDb, generateId } from '../../db.js';
import { now } from '../../utils/index.js';

export function createJob({ userId, type, payload }) {
  const db = getDb();
  const id = generateId();
  db.prepare(
    `INSERT INTO jobs (id, user_id, type, status, progress, payload_json, result_json, error, created_at, updated_at)
     VALUES (?, ?, ?, 'pending', 0, ?, NULL, NULL, ?, ?)`
  ).run(id, userId, type, JSON.stringify(payload), now(), now());
  return getJob(id);
}

export function getJob(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  if (!row) return null;
  return rowToJob(row);
}

export function listJobsForUser(userId, limit = 50) {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(userId, limit);
  return rows.map(rowToJob);
}

export function updateJob(id, { status, progress, result, error }) {
  const db = getDb();
  const sets = ['updated_at = ?'];
  const params = [now()];

  if (status !== undefined) {
    sets.push('status = ?');
    params.push(status);
  }
  if (progress !== undefined) {
    sets.push('progress = ?');
    params.push(progress);
  }
  if (result !== undefined) {
    sets.push('result_json = ?');
    params.push(JSON.stringify(result));
  }
  if (error !== undefined) {
    sets.push('error = ?');
    params.push(error);
  }

  params.push(id);
  db.prepare(`UPDATE jobs SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return getJob(id);
}

export function claimPendingJob() {
  const db = getDb();
  const row = db.prepare(
    `SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1`
  ).get();
  if (!row) return null;

  // Optimistic lock: only claim if still pending
  const result = db.prepare(
    `UPDATE jobs SET status = 'running', progress = 5, updated_at = ?
     WHERE id = ? AND status = 'pending'`
  ).run(now(), row.id);

  if (result.changes === 0) return null;
  return getJob(row.id);
}

function rowToJob(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    status: row.status,
    progress: row.progress,
    payload: parseJson(row.payload_json),
    result: parseJson(row.result_json),
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
