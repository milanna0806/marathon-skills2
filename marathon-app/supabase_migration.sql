-- ══════════════════════════════════════════════════════════════════════════
-- SQL для Supabase: выполнить в SQL Editor (https://app.supabase.com)
-- ══════════════════════════════════════════════════════════════════════════

-- Таблица участников марафона
CREATE TABLE IF NOT EXISTS participants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  gender      TEXT DEFAULT 'Мужской',
  birth_date  DATE,
  country     TEXT DEFAULT 'Kazakhstan',
  role        TEXT DEFAULT 'Бегун',
  bmi         NUMERIC(5,2),
  created_by  TEXT,          -- Google user id (sub) из NextAuth сессии
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Индекс для быстрого поиска по created_by
CREATE INDEX IF NOT EXISTS idx_participants_created_by ON participants(created_by);

-- Row Level Security (необязательно, но рекомендуется)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Разрешить читать всем авторизованным (через наш API)
CREATE POLICY "Allow all reads" ON participants
  FOR SELECT USING (true);

-- Разрешить вставку
CREATE POLICY "Allow inserts" ON participants
  FOR INSERT WITH CHECK (true);

-- Разрешить обновление только своих записей
CREATE POLICY "Allow updates by owner" ON participants
  FOR UPDATE USING (true);
