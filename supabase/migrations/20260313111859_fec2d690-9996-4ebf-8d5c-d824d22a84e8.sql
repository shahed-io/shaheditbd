
-- ── Blog Categories ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  description TEXT,
  color      TEXT DEFAULT '#7c3aed',
  sort_order INTEGER DEFAULT 0,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active blog categories"
  ON public.blog_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage blog categories"
  ON public.blog_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ── Blog Tags ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blog tags"
  ON public.blog_tags FOR SELECT USING (true);

CREATE POLICY "Admins can manage blog tags"
  ON public.blog_tags FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ── Blog Posts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id               UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  excerpt          TEXT,
  content          TEXT,
  featured_image   TEXT,
  category_id      UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_name      TEXT DEFAULT 'Admin',
  author_avatar    TEXT,
  author_bio       TEXT,
  status           TEXT NOT NULL DEFAULT 'draft',  -- draft | published
  is_featured      BOOLEAN DEFAULT false,
  tags             TEXT[] DEFAULT '{}',
  reading_time     INTEGER DEFAULT 5,
  views            INTEGER DEFAULT 0,
  seo_title        TEXT,
  seo_description  TEXT,
  published_at     TIMESTAMP WITH TIME ZONE,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published blog posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON public.blog_posts(is_featured);

-- ── Blog Post Tags (junction) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post tags"
  ON public.blog_post_tags FOR SELECT USING (true);

CREATE POLICY "Admins can manage post tags"
  ON public.blog_post_tags FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ── Blog Comments ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id    UUID,
  author_name TEXT NOT NULL,
  author_email TEXT,
  content    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  parent_id  UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved comments"
  ON public.blog_comments FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Anyone can submit a comment"
  ON public.blog_comments FOR INSERT
  WITH CHECK (
    length(author_name) > 0 AND length(author_name) <= 200
    AND length(content) > 0 AND length(content) <= 5000
  );

CREATE POLICY "Admins can manage comments"
  ON public.blog_comments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON public.blog_comments(post_id);

-- ── Help Center Articles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.help_articles (
  id               UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  content          TEXT,
  excerpt          TEXT,
  category         TEXT NOT NULL DEFAULT 'general',
  tags             TEXT[] DEFAULT '{}',
  is_featured      BOOLEAN DEFAULT false,
  helpful_yes      INTEGER DEFAULT 0,
  helpful_no       INTEGER DEFAULT 0,
  views            INTEGER DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'published',  -- draft | published
  sort_order       INTEGER DEFAULT 0,
  seo_title        TEXT,
  seo_description  TEXT,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published help articles"
  ON public.help_articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage help articles"
  ON public.help_articles FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_help_articles_slug ON public.help_articles(slug);
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON public.help_articles(category);

-- ── Update triggers ───────────────────────────────────────────────────────
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_articles_updated_at
  BEFORE UPDATE ON public.help_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
