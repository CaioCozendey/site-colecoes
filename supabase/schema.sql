-- =====================================================================
-- Minhas Coleções — schema do MVP (PostgreSQL / Supabase)
-- Rode este arquivo UMA vez em: Supabase > SQL Editor > New query
-- =====================================================================

-- ---------- Tabelas ---------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    varchar(30) unique check (username ~ '^[a-z0-9_]{3,30}$'),
  name        varchar(100),
  avatar_url  text,
  currency    varchar(3) not null default 'BRL' check (currency in ('BRL','USD','EUR')),
  is_public   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        varchar(120) not null,
  description text,
  category    varchar(40) not null default 'Outros',
  cover_url   text,
  visibility  varchar(10) not null default 'private' check (visibility in ('private','public')),
  goal_count  integer check (goal_count is null or goal_count > 0), -- objetivo da coleção
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index collections_user_idx on public.collections(user_id);

create table public.items (
  id              uuid primary key default gen_random_uuid(),
  collection_id   uuid not null references public.collections(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            varchar(200) not null,
  description     text,
  status          varchar(10) not null default 'owned' check (status in ('owned','wishlist')),
  year            varchar(20),
  creator         varchar(150),          -- fabricante / autor / emissor
  reference_code  varchar(100),          -- número / código / referência
  condition       varchar(60),
  quantity        integer not null default 1 check (quantity >= 1),
  purchase_price  numeric(12,2) check (purchase_price is null or purchase_price >= 0),
  estimated_value numeric(12,2) check (estimated_value is null or estimated_value >= 0),
  desired_price   numeric(12,2) check (desired_price is null or desired_price >= 0), -- wishlist
  purchase_date   date,
  purchase_source varchar(150),
  priority        varchar(10) check (priority in ('low','medium','high')),         -- wishlist
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index items_user_idx on public.items(user_id);
create index items_collection_idx on public.items(collection_id);
create index items_status_idx on public.items(user_id, status);

create table public.item_images (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references public.items(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  image_url    text not null,
  storage_path text,
  sort_order   integer not null default 0,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now()
);
create index item_images_item_idx on public.item_images(item_id);

create table public.tags (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references public.profiles(id) on delete cascade,
  name     varchar(50) not null,
  unique (user_id, name)
);

create table public.item_tags (
  item_id uuid not null references public.items(id) on delete cascade,
  tag_id  uuid not null references public.tags(id) on delete cascade,
  primary key (item_id, tag_id)
);

-- ---------- Triggers --------------------------------------------------

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger collections_updated before update on public.collections
  for each row execute function public.set_updated_at();
create trigger items_updated before update on public.items
  for each row execute function public.set_updated_at();

-- Cria o profile automaticamente quando alguém se cadastra
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into public.profiles (id, name, username)
    values (
      new.id,
      nullif(new.raw_user_meta_data->>'name', ''),
      nullif(lower(new.raw_user_meta_data->>'username'), '')
    );
  exception when unique_violation or check_violation then
    -- username já usado ou inválido: cria o profile sem username
    insert into public.profiles (id, name)
    values (new.id, nullif(new.raw_user_meta_data->>'name', ''));
  end;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ---------------------------------------

alter table public.profiles    enable row level security;
alter table public.collections enable row level security;
alter table public.items       enable row level security;
alter table public.item_images enable row level security;
alter table public.tags        enable row level security;
alter table public.item_tags   enable row level security;

-- profiles
create policy profiles_select on public.profiles for select using (id = auth.uid());
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- collections (públicas podem ser lidas por qualquer um)
create policy collections_select on public.collections for select
  using (user_id = auth.uid() or visibility = 'public');
create policy collections_insert on public.collections for insert with check (user_id = auth.uid());
create policy collections_update on public.collections for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy collections_delete on public.collections for delete using (user_id = auth.uid());

-- items (o item só pode apontar para uma coleção do próprio usuário)
create policy items_select on public.items for select using (
  user_id = auth.uid()
  or (status = 'owned' and exists (
        select 1 from public.collections c
        where c.id = items.collection_id and c.visibility = 'public'))
);
create policy items_insert on public.items for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
);
create policy items_update on public.items for update using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
);
create policy items_delete on public.items for delete using (user_id = auth.uid());

-- item_images
create policy item_images_select on public.item_images for select using (
  user_id = auth.uid()
  or exists (
    select 1 from public.items i join public.collections c on c.id = i.collection_id
    where i.id = item_images.item_id and i.status = 'owned' and c.visibility = 'public')
);
create policy item_images_insert on public.item_images for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid())
);
create policy item_images_update on public.item_images for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy item_images_delete on public.item_images for delete using (user_id = auth.uid());

-- tags
create policy tags_all on public.tags for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- item_tags
create policy item_tags_all on public.item_tags for all
  using (exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()))
  with check (
    exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid())
    and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
  );

-- ---------- Storage (fotos) ------------------------------------------
-- Bucket público para leitura; só o dono escreve na própria pasta (<uid>/...)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-images', 'item-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy item_images_storage_read on storage.objects for select
  using (bucket_id = 'item-images');
create policy item_images_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy item_images_storage_update on storage.objects for update to authenticated
  using (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy item_images_storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
