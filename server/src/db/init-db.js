import pool from './pool.js';

export default async function initDb() {
  const sql = `
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    -- users
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text DEFAULT NULL,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      is_verified boolean NOT NULL DEFAULT false,
      token_version int NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));

    -- notes
    CREATE TABLE IF NOT EXISTS notes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title text NOT NULL,
      content text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id, created_at DESC);

    -- schools
    CREATE TABLE IF NOT EXISTS schools (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      addr text,
      contact_email text,
      contact_phone text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(lower(name));

    -- memberships
    CREATE TABLE IF NOT EXISTS memberships (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_role text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (school_id, user_id)
    );
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'memberships_role_check'
      ) THEN
        ALTER TABLE memberships
          ADD CONSTRAINT memberships_role_check CHECK (user_role IN ('admin','teacher','student'));
      END IF;
    END $$;
    CREATE INDEX IF NOT EXISTS idx_memberships_school ON memberships(school_id);
    CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);

    -- member requests
    CREATE TABLE IF NOT EXISTS member_req (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_role text NOT NULL DEFAULT 'teacher',
      accepted boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (school_id, user_id)
    );
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'member_req_role_check'
      ) THEN
        ALTER TABLE member_req
          ADD CONSTRAINT member_req_role_check CHECK (user_role IN ('teacher','student'));
      END IF;
    END $$;
    CREATE INDEX IF NOT EXISTS idx_member_req_school ON member_req(school_id, accepted);

    -- programs
    CREATE TABLE IF NOT EXISTS programs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      name text NOT NULL,
      descr text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_programs_school ON programs(school_id);
    CREATE INDEX IF NOT EXISTS idx_programs_school_name ON programs(school_id, lower(name));

    -- subjects
    CREATE TABLE IF NOT EXISTS subjects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_subjects_program ON subjects(program_id, lower(name));

    -- program_subject meta
    CREATE TABLE IF NOT EXISTS program_subject (
      program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      year int NOT NULL DEFAULT 0,
      is_required boolean NOT NULL DEFAULT true,
      weekly_hours int NOT NULL DEFAULT 1 CHECK (weekly_hours > 0),
      weight int NOT NULL DEFAULT 1,
      PRIMARY KEY (program_id, subject_id)
    );
    CREATE INDEX IF NOT EXISTS idx_progsub_program ON program_subject(program_id, year, is_required);

    -- school years
    CREATE TABLE IF NOT EXISTS school_years (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      name text NOT NULL,
      start_date date NOT NULL,
      end_date date NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_school_years_school ON school_years(school_id, start_date);

    -- periods
    CREATE TABLE IF NOT EXISTS periods (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      school_year_id uuid NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
      start_time time NOT NULL,
      end_time time NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CHECK (end_time > start_time)
    );
    CREATE INDEX IF NOT EXISTS idx_periods_year ON periods(school_year_id, start_time);

    -- ===== NEW: classrooms / classes / enrollments / projects =====

    -- classrooms (aka groups) per school
    -- classrooms (aka groups) per school
CREATE TABLE IF NOT EXISTS classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- UNIQ pe (school_id, lower(name)) se face cu INDEX, nu cu UNIQUE constraint
CREATE UNIQUE INDEX IF NOT EXISTS uq_classrooms_school_lower_name
  ON classrooms (school_id, lower(name));

CREATE INDEX IF NOT EXISTS idx_classrooms_school
  ON classrooms(school_id, lower(name));

    -- student_classroom: membership of students in classrooms
    CREATE TABLE IF NOT EXISTS student_classroom (
      student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
      PRIMARY KEY (student_id, classroom_id)
    );
    CREATE INDEX IF NOT EXISTS idx_studclass_classroom ON student_classroom(classroom_id);

    -- classes: an instance of a subject taught by a teacher (optionally bound to a classroom and periods)
    CREATE TABLE IF NOT EXISTS classes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name text NOT NULL,
      start_period_id uuid NULL REFERENCES periods(id) ON DELETE SET NULL,
      end_period_id uuid NULL REFERENCES periods(id) ON DELETE SET NULL,
      classroom_id uuid NULL REFERENCES classrooms(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_classes_subject ON classes(subject_id);
    CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_classes_classroom ON classes(classroom_id);

    -- student enrollment to a class, with a score
    CREATE TABLE IF NOT EXISTS stud_classes (
      student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      class_score int NOT NULL DEFAULT 0 CHECK (class_score >= 0),
      PRIMARY KEY (student_id, class_id)
    );
    CREATE INDEX IF NOT EXISTS idx_studclasses_class ON stud_classes(class_id);

    -- projects owned by a teacher, optionally tied to a class
    CREATE TABLE IF NOT EXISTS projects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      class_id uuid NULL REFERENCES classes(id) ON DELETE CASCADE,
      name text NOT NULL,
      owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_projects_class ON projects(class_id);

    -- branches: participation of users in a project
    CREATE TABLE IF NOT EXISTS branches (
      project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      active boolean NOT NULL DEFAULT true,
      PRIMARY KEY (project_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_branches_user ON branches(user_id);
  `;

  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query('SELECT pg_advisory_xact_lock($1)', [20250927]);
    await c.query(sql);
    await c.query('COMMIT');
    console.log('[db] init OK');
  } catch (e) {
    await c.query('ROLLBACK').catch(() => { });
    console.error('[db] init FAILED', e.message);
    throw e;
  } finally {
    c.release();
  }
}