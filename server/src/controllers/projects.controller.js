import pool from '../db/pool.js';

export async function listClassProjects(req, res) {
  const { classId } = req.params;
  // teacher can see only own class; student can see only enrolled
  if (req.roles?.includes('teacher')) {
    const q = await pool.query('SELECT 1 FROM classes WHERE id=$1 AND teacher_id=$2', [classId, req.user.id]);
    if (!q.rows[0]) return res.status(403).json({ success:false, message:'Forbidden' });
  } else {
    const q = await pool.query('SELECT 1 FROM stud_classes WHERE class_id=$1 AND student_id=$2', [classId, req.user.id]);
    if (!q.rows[0]) return res.status(403).json({ success:false, message:'Forbidden' });
  }
  const { rows } = await pool.query('SELECT * FROM projects WHERE class_id=$1 ORDER BY created_at DESC', [classId]);
  return res.json({ success:true, projects: rows });
}

export async function createProject(req, res) {
  const { classId } = req.params;
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ success:false, message:'Missing name' });

  const c = await pool.query('SELECT id FROM classes WHERE id=$1 AND teacher_id=$2', [classId, req.user.id]);
  if (!c.rows[0]) return res.status(403).json({ success:false, message:'Forbidden' });

  const pr = await pool.query(
    'INSERT INTO projects (class_id, name, owner_id) VALUES ($1,$2,$3) RETURNING *',
    [classId, name, req.user.id]
  );

  // create branches for all enrolled students
  await pool.query(
    `INSERT INTO branches (project_id, user_id)
     SELECT $1, sc.student_id FROM stud_classes sc WHERE sc.class_id=$2
     ON CONFLICT DO NOTHING`,
    [pr.rows[0].id, classId]
  );

  return res.status(201).json({ success:true, project: pr.rows[0] });
}

export async function updateProject(req, res) {
  const { id } = req.params;
  const owner = await pool.query(
    `SELECT p.id FROM projects p
     JOIN classes c ON c.id=p.class_id
     WHERE p.id=$1 AND c.teacher_id=$2`, [id, req.user.id]);
  if (!owner.rows[0]) return res.status(403).json({ success:false, message:'Forbidden' });

  const { name } = req.body || {};
  const { rows } = await pool.query('UPDATE projects SET name=COALESCE($1,name) WHERE id=$2 RETURNING *', [name ?? null, id]);
  return res.json({ success:true, project: rows[0] });
}

export async function deleteProject(req, res) {
  const { id } = req.params;
  const owner = await pool.query(
    `SELECT p.id FROM projects p
     JOIN classes c ON c.id=p.class_id
     WHERE p.id=$1 AND c.teacher_id=$2`, [id, req.user.id]);
  if (!owner.rows[0]) return res.status(403).json({ success:false, message:'Forbidden' });

  await pool.query('DELETE FROM projects WHERE id=$1', [id]); // cascades branches
  return res.json({ success:true });
}