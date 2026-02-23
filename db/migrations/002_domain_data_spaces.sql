CREATE SCHEMA IF NOT EXISTS task_data;
CREATE SCHEMA IF NOT EXISTS goal_data;
CREATE SCHEMA IF NOT EXISTS finance_data;

CREATE TABLE IF NOT EXISTS task_data.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category_id TEXT,
  due_date DATE,
  priority TEXT,
  is_habit BOOLEAN NOT NULL DEFAULT false,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  done BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_data_tasks_user_id ON task_data.tasks(user_id);

CREATE TABLE IF NOT EXISTS goal_data.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goal_data_goals_user_id ON goal_data.goals(user_id);

CREATE TABLE IF NOT EXISTS finance_data.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_data_records_user_id ON finance_data.records(user_id);

DO $$
BEGIN
  IF to_regclass('public.tasks') IS NOT NULL THEN
    EXECUTE $migration$
      INSERT INTO task_data.tasks (id, user_id, title, done, created_at, updated_at)
      SELECT id, user_id, title, done, created_at, created_at
      FROM public.tasks
      ON CONFLICT (id) DO NOTHING
    $migration$;
  END IF;
END
$$;
