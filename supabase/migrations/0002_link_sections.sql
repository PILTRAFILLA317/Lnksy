-- =============================================================
-- Migration: Add link_sections table for multi-section page builder
-- Run AFTER 0001_add_sections.sql
-- Idempotent — safe to re-run
-- =============================================================

-- 1. Create link_sections table
CREATE TABLE IF NOT EXISTS public.link_sections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        text,
  layout       text NOT NULL DEFAULT 'LIST_ICON'
               CHECK (layout IN ('LIST_ICON','GRID_ICON','GRID_IMAGE','LIST_IMAGE')),
  is_visible   boolean NOT NULL DEFAULT true,
  order_index  int NOT NULL DEFAULT 0,
  options      jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_link_sections_profile
  ON public.link_sections (profile_id, order_index);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_link_sections_updated_at ON public.link_sections;
CREATE TRIGGER trg_link_sections_updated_at
  BEFORE UPDATE ON public.link_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Add section_id to links (nullable first for migration)
ALTER TABLE public.links
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.link_sections(id) ON DELETE CASCADE;

-- 3. Data migration: create 1 default section per profile that has no section yet
DO $$
DECLARE
  rec RECORD;
  new_section_id uuid;
BEGIN
  FOR rec IN
    SELECT p.id, p.main_links_layout
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.link_sections ls WHERE ls.profile_id = p.id
    )
  LOOP
    INSERT INTO public.link_sections (profile_id, title, layout, order_index)
    VALUES (rec.id, NULL, rec.main_links_layout, 0)
    RETURNING id INTO new_section_id;

    UPDATE public.links
    SET section_id = new_section_id
    WHERE profile_id = rec.id AND section_id IS NULL;
  END LOOP;

  -- Also assign orphan links (have profile with sections but section_id is null)
  FOR rec IN
    SELECT l.id AS link_id, ls.id AS section_id
    FROM public.links l
    JOIN public.link_sections ls ON ls.profile_id = l.profile_id
    WHERE l.section_id IS NULL
      AND ls.order_index = 0
  LOOP
    UPDATE public.links SET section_id = rec.section_id WHERE id = rec.link_id;
  END LOOP;
END $$;

-- 4. Make section_id NOT NULL now that all rows are migrated
DO $$
BEGIN
  -- Only set NOT NULL if not already set
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'links'
      AND column_name = 'section_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.links ALTER COLUMN section_id SET NOT NULL;
  END IF;
END $$;

-- 5. Add index for section_id lookups
CREATE INDEX IF NOT EXISTS idx_links_section
  ON public.links (section_id, order_index);

-- 6. RLS for link_sections
ALTER TABLE public.link_sections ENABLE ROW LEVEL SECURITY;

-- Owner can CRUD own sections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'link_sections' AND policyname = 'Owner can manage own sections'
  ) THEN
    CREATE POLICY "Owner can manage own sections"
      ON public.link_sections FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = link_sections.profile_id
            AND owner_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = link_sections.profile_id
            AND owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Public can read visible sections of public profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'link_sections' AND policyname = 'Public can read visible sections'
  ) THEN
    CREATE POLICY "Public can read visible sections"
      ON public.link_sections FOR SELECT
      USING (
        is_visible = true
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = link_sections.profile_id
            AND deleted_at IS NULL
        )
      );
  END IF;
END $$;

-- 7. No section limit — all plans can create multiple sections
-- Clean up old trigger if it exists
DROP TRIGGER IF EXISTS trg_check_section_limit ON public.link_sections;
DROP FUNCTION IF EXISTS public.check_section_limit();
