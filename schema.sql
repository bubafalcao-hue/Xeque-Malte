-- Rode no Supabase: SQL Editor > New query > colar > Run.

create table public.subunidades (
  id bigint generated always as identity primary key,
  fase text not null check (fase in ('abertura','meio-jogo','finais')),
  tema text not null check (tema in ('calculo','estrategia','tatica')),
  titulo text not null,
  conteudo text not null default '',
  unique (fase, tema)
);

create table public.fontes (
  id bigint generated always as identity primary key,
  subunidade_id bigint not null references public.subunidades(id) on delete cascade,
  titulo text not null,
  url text,        -- link externo (https://...)
  arquivo text     -- ou caminho de um PDF no bucket "livros", ex.: abertura/livro.pdf
);

-- Só usuários logados leem. Ninguém edita pelo site (você edita pelo painel).
alter table public.subunidades enable row level security;
alter table public.fontes enable row level security;

create policy "logados leem subunidades" on public.subunidades
  for select to authenticated using (true);
create policy "logados leem fontes" on public.fontes
  for select to authenticated using (true);

-- Bucket privado para os PDFs
insert into storage.buckets (id, name, public) values ('livros', 'livros', false)
  on conflict (id) do nothing;
create policy "logados leem livros" on storage.objects
  for select to authenticated using (bucket_id = 'livros');

-- As 9 subunidades, com texto provisório
insert into public.subunidades (fase, tema, titulo, conteudo) values
  ('abertura','calculo','Cálculo em abertura','Escreva aqui.'),
  ('abertura','estrategia','Estratégia em abertura','Escreva aqui.'),
  ('abertura','tatica','Tática em abertura','Escreva aqui.'),
  ('meio-jogo','calculo','Cálculo em meio-jogo','Escreva aqui.'),
  ('meio-jogo','estrategia','Estratégia em meio-jogo','Escreva aqui.'),
  ('meio-jogo','tatica','Tática em meio-jogo','Escreva aqui.'),
  ('finais','calculo','Cálculo em finais','Escreva aqui.'),
  ('finais','estrategia','Estratégia em finais','Escreva aqui.'),
  ('finais','tatica','Tática em finais','Escreva aqui.');
