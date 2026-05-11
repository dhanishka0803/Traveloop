
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  language text default 'en',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- CITIES catalog (public)
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  cost_index int not null default 50,
  popularity int not null default 50,
  image_url text,
  description text,
  created_at timestamptz not null default now()
);
alter table public.cities enable row level security;
create policy "cities_public_read" on public.cities for select using (true);

-- ACTIVITIES catalog (public)
create table public.activities_catalog (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities(id) on delete cascade,
  name text not null,
  type text not null default 'culture',
  description text,
  avg_cost numeric not null default 0,
  duration_minutes int not null default 60,
  image_url text
);
alter table public.activities_catalog enable row level security;
create policy "activities_catalog_public_read" on public.activities_catalog for select using (true);

-- TRIPS
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  start_date date not null,
  end_date date not null,
  cover_url text,
  is_public boolean not null default false,
  public_token text unique default encode(gen_random_bytes(12), 'hex'),
  is_sellable boolean not null default false,
  price numeric default 0,
  green_score int default 70,
  budget numeric default 1000,
  created_at timestamptz not null default now()
);
alter table public.trips enable row level security;
create policy "trips_select_own_or_public" on public.trips for select using (auth.uid() = user_id or is_public = true);
create policy "trips_insert_own" on public.trips for insert with check (auth.uid() = user_id);
create policy "trips_update_own" on public.trips for update using (auth.uid() = user_id);
create policy "trips_delete_own" on public.trips for delete using (auth.uid() = user_id);

-- STOPS
create table public.stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  city_id uuid references public.cities(id),
  city_name text,
  start_date date,
  end_date date,
  sequence int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.stops enable row level security;
create policy "stops_select" on public.stops for select using (
  exists(select 1 from public.trips t where t.id = trip_id and (t.user_id = auth.uid() or t.is_public))
);
create policy "stops_modify" on public.stops for all using (
  exists(select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
) with check (
  exists(select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
);

-- TRIP ACTIVITIES
create table public.trip_activities (
  id uuid primary key default gen_random_uuid(),
  stop_id uuid not null references public.stops(id) on delete cascade,
  name text not null,
  type text not null default 'culture',
  cost numeric not null default 0,
  duration_minutes int not null default 60,
  time_slot text,
  day_offset int not null default 0,
  sequence int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.trip_activities enable row level security;
create policy "trip_activities_select" on public.trip_activities for select using (
  exists(select 1 from public.stops s join public.trips t on t.id = s.trip_id where s.id = stop_id and (t.user_id = auth.uid() or t.is_public))
);
create policy "trip_activities_modify" on public.trip_activities for all using (
  exists(select 1 from public.stops s join public.trips t on t.id = s.trip_id where s.id = stop_id and t.user_id = auth.uid())
) with check (
  exists(select 1 from public.stops s join public.trips t on t.id = s.trip_id where s.id = stop_id and t.user_id = auth.uid())
);

-- EXPENSES
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null default 'activities',
  amount numeric not null default 0,
  note text,
  created_at timestamptz not null default now()
);
alter table public.expenses enable row level security;
create policy "expenses_owner_all" on public.expenses for all using (
  exists(select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
) with check (
  exists(select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
);

-- CHECKLIST
create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  category text not null default 'general',
  is_packed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.checklist_items enable row level security;
create policy "checklist_owner_all" on public.checklist_items for all using (
  exists(select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
) with check (
  exists(select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
);

-- NOTES
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  stop_id uuid references public.stops(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.notes enable row level security;
create policy "notes_select" on public.notes for select using (
  exists(select 1 from public.trips t where t.id = trip_id and (t.user_id = auth.uid() or t.is_public))
);
create policy "notes_modify" on public.notes for all using (
  exists(select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
) with check (
  exists(select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
);

-- DEMO CITIES
insert into public.cities (name, country, cost_index, popularity, image_url, description) values
('Paris','France',85,98,'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800','City of light and love'),
('Tokyo','Japan',80,96,'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800','Neon-lit megacity blending tradition and tech'),
('Bali','Indonesia',35,92,'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800','Tropical paradise of beaches and temples'),
('New York','USA',95,97,'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800','The city that never sleeps'),
('Rome','Italy',70,90,'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800','Eternal city of ancient wonders'),
('Barcelona','Spain',65,88,'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800','Gaudí, beaches, and tapas'),
('Marrakech','Morocco',40,78,'https://images.unsplash.com/photo-1597212720130-d1b4cd5b53b6?w=800','Vibrant souks and desert gateway'),
('Reykjavik','Iceland',90,75,'https://images.unsplash.com/photo-1490650404312-a2175773bbf5?w=800','Northern lights and volcanic landscapes'),
('Cape Town','South Africa',55,82,'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800','Where mountains meet the ocean'),
('Bangkok','Thailand',45,89,'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800','Street food capital and golden temples');

-- DEMO ACTIVITIES (2 per city)
insert into public.activities_catalog (city_id, name, type, description, avg_cost, duration_minutes, image_url)
select id,'Eiffel Tower Visit','culture','Iconic iron lattice tower',35,120,'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=600' from public.cities where name='Paris'
union all select id,'Seine River Cruise','leisure','Romantic boat ride',25,90,'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=600' from public.cities where name='Paris'
union all select id,'Shibuya Crossing','culture','Famous scramble crossing',0,60,'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600' from public.cities where name='Tokyo'
union all select id,'Sushi Making Class','food','Hands-on sushi workshop',80,150,'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600' from public.cities where name='Tokyo'
union all select id,'Ubud Rice Terraces','nature','Lush green stepped fields',15,180,'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600' from public.cities where name='Bali'
union all select id,'Surfing Lesson','adventure','Catch waves at Kuta',40,120,'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600' from public.cities where name='Bali'
union all select id,'Central Park Walk','nature','Iconic urban park stroll',0,120,'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=600' from public.cities where name='New York'
union all select id,'Broadway Show','nightlife','World class theater',120,180,'https://images.unsplash.com/photo-1503095396549-807759245b35?w=600' from public.cities where name='New York'
union all select id,'Colosseum Tour','culture','Ancient amphitheater',30,150,'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600' from public.cities where name='Rome'
union all select id,'Pasta Cooking Class','food','Make authentic pasta',75,180,'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600' from public.cities where name='Rome'
union all select id,'Sagrada Familia','culture','Gaudís masterpiece',26,90,'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600' from public.cities where name='Barcelona'
union all select id,'Tapas Tour','food','Sample local tapas bars',55,180,'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=600' from public.cities where name='Barcelona'
union all select id,'Jemaa el-Fnaa','culture','Vibrant central square',0,120,'https://images.unsplash.com/photo-1597212720130-d1b4cd5b53b6?w=600' from public.cities where name='Marrakech'
union all select id,'Sahara Desert Trek','adventure','Camel ride into dunes',150,480,'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600' from public.cities where name='Marrakech'
union all select id,'Northern Lights Tour','nature','Aurora borealis chase',95,300,'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=600' from public.cities where name='Reykjavik'
union all select id,'Blue Lagoon','leisure','Geothermal spa',85,180,'https://images.unsplash.com/photo-1490650404312-a2175773bbf5?w=600' from public.cities where name='Reykjavik'
union all select id,'Table Mountain Hike','adventure','Cable car or hike',30,240,'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600' from public.cities where name='Cape Town'
union all select id,'Wine Tour Stellenbosch','food','Vineyard tastings',70,300,'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600' from public.cities where name='Cape Town'
union all select id,'Grand Palace','culture','Royal complex tour',15,120,'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600' from public.cities where name='Bangkok'
union all select id,'Street Food Tour','food','Night market feast',35,180,'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600' from public.cities where name='Bangkok';
