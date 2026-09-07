create table if not exists public.outreach_prospects (
  id uuid primary key default gen_random_uuid(),
  site_name text not null,
  site_url text,
  contact_name text,
  contact_email text,
  contact_channel text default 'email',
  category text default 'tech_blog',
  domain_authority int,
  status text not null default 'prospect',
  pitch_template text default 'guest_post',
  notes text,
  last_contacted_at timestamptz,
  follow_up_at timestamptz,
  published_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outreach_prospects_status_idx on public.outreach_prospects(status);
create index if not exists outreach_prospects_followup_idx on public.outreach_prospects(follow_up_at);

alter table public.outreach_prospects enable row level security;

create policy "Admins manage outreach"
  on public.outreach_prospects
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.touch_outreach_prospects_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_outreach_prospects_updated on public.outreach_prospects;
create trigger trg_outreach_prospects_updated
  before update on public.outreach_prospects
  for each row execute function public.touch_outreach_prospects_updated_at();

insert into public.outreach_prospects (site_name, site_url, category, pitch_template, notes)
values
  ('TechTunes', 'https://www.techtunes.io', 'tech_blog', 'guest_post', 'Largest BD Bangla tech blog. Submit via /tuner-register.'),
  ('Pingbiz', 'https://www.pingbiz.com', 'tech_blog', 'guest_post', 'BD tech & startup blog.'),
  ('PriyoTech', 'https://tech.priyo.com', 'news', 'review', 'Tech section of priyo.com — pitch product reviews.'),
  ('BD Tech Talkies (FB Group)', 'https://www.facebook.com/groups/bdtechtalkies', 'facebook_group', 'resource_link', 'Active BD tech FB group, ~200K members.'),
  ('Software Lover BD (FB Group)', 'https://www.facebook.com/groups/softwareloverbd', 'facebook_group', 'review', 'Niche software/license discussion group.'),
  ('Riseup Labs Blog', 'https://riseuplabs.com/blog', 'tech_blog', 'partnership', 'Local dev agency blog — partnership angle.')
on conflict do nothing;