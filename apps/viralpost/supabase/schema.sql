-- Nichos configuráveis
create table niches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  keywords text[],
  category_id text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Vídeos trending encontrados
create table trending_videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text unique not null,
  title text not null,
  channel_name text,
  channel_id text,
  thumbnail_url text,
  view_count bigint,
  like_count bigint,
  comment_count bigint,
  duration text,
  published_at timestamptz,
  transcript text,
  transcript_language text,
  niche_id uuid references niches(id),
  processed boolean default false,
  created_at timestamptz default now()
);

-- Posts de carrossel gerados
create table carousel_posts (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references trending_videos(id),
  slides jsonb not null,
  caption text,
  hashtags text[],
  status text default 'draft',
  posted_at timestamptz,
  created_at timestamptz default now()
);

-- Log de execuções do cron
create table cron_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz default now(),
  finished_at timestamptz,
  videos_found int default 0,
  videos_processed int default 0,
  posts_generated int default 0,
  errors jsonb,
  status text default 'running'
);

-- Seed de nichos iniciais
insert into niches (name, category_id, active) values
  ('Geral Brasil', null, true),
  ('Tecnologia', '28', true),
  ('Entretenimento', '24', true);
