-- Adiciona contagem de inscritos e modo de busca ao trending_videos
alter table trending_videos
  add column if not exists subscriber_count bigint default 0,
  add column if not exists like_view_ratio numeric(5,2) default 0,
  add column if not exists search_mode text default 'trending'; -- 'trending' | 'search'

-- Nichos de curiosidade (busca por keywords)
insert into niches (name, keywords, active) values
  ('Curiosidades & Mistérios', array[
    'documentary mystery',
    'the search for',
    'unsolved mysteries',
    'the science behind',
    'history of everyday things',
    'secret history of',
    'what really happened'
  ], true),
  ('Ciência & Tecnologia', array[
    'the science behind technology',
    'how it actually works',
    'engineering explained',
    'physics of everyday life',
    'chemistry you never knew'
  ], true),
  ('História & Sociedade', array[
    'forgotten history of',
    'the real story behind',
    'how ancient civilizations',
    'lost knowledge of',
    'conspiracy that turned out true'
  ], true)
on conflict do nothing;
