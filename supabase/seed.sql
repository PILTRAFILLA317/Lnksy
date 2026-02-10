-- =============================================================
-- Lnksy — Seed Data
-- Run after schema.sql
-- =============================================================

-- 1. Themes (3 free + 10 pro)
insert into public.themes (id, name, is_pro, config) values
  ('default', 'Default', false, '{
    "bg": "#ffffff",
    "text": "#1a1a1a",
    "cardBg": "#f3f4f6",
    "cardText": "#1a1a1a",
    "cardBorder": "transparent",
    "cardRadius": "12px",
    "buttonVariant": "filled",
    "font": "Inter, sans-serif"
  }'),
  ('midnight', 'Midnight', false, '{
    "bg": "#0f172a",
    "text": "#f1f5f9",
    "cardBg": "#1e293b",
    "cardText": "#f1f5f9",
    "cardBorder": "#334155",
    "cardRadius": "12px",
    "buttonVariant": "filled",
    "font": "Inter, sans-serif"
  }'),
  ('forest', 'Forest', false, '{
    "bg": "#064e3b",
    "text": "#ecfdf5",
    "cardBg": "#065f46",
    "cardText": "#ecfdf5",
    "cardBorder": "#047857",
    "cardRadius": "16px",
    "buttonVariant": "filled",
    "font": "Inter, sans-serif"
  }'),
  ('sunset', 'Sunset', true, '{
    "bg": "linear-gradient(135deg, #f97316, #ec4899)",
    "text": "#ffffff",
    "cardBg": "rgba(255,255,255,0.15)",
    "cardText": "#ffffff",
    "cardBorder": "rgba(255,255,255,0.25)",
    "cardRadius": "16px",
    "buttonVariant": "outline",
    "font": "Inter, sans-serif"
  }'),
  ('ocean', 'Ocean', true, '{
    "bg": "linear-gradient(180deg, #0ea5e9, #6366f1)",
    "text": "#ffffff",
    "cardBg": "rgba(255,255,255,0.12)",
    "cardText": "#ffffff",
    "cardBorder": "rgba(255,255,255,0.2)",
    "cardRadius": "24px",
    "buttonVariant": "filled",
    "font": "Inter, sans-serif"
  }'),
  ('candy', 'Candy', true, '{
    "bg": "linear-gradient(135deg, #f472b6, #a78bfa)",
    "text": "#ffffff",
    "cardBg": "rgba(255,255,255,0.2)",
    "cardText": "#ffffff",
    "cardBorder": "transparent",
    "cardRadius": "999px",
    "buttonVariant": "filled",
    "font": "Inter, sans-serif"
  }'),
  ('neon', 'Neon', true, '{
    "bg": "#09090b",
    "text": "#22d3ee",
    "cardBg": "transparent",
    "cardText": "#22d3ee",
    "cardBorder": "#22d3ee",
    "cardRadius": "8px",
    "buttonVariant": "outline",
    "font": "JetBrains Mono, monospace"
  }'),
  ('minimal', 'Minimal', true, '{
    "bg": "#fafafa",
    "text": "#171717",
    "cardBg": "transparent",
    "cardText": "#171717",
    "cardBorder": "#e5e5e5",
    "cardRadius": "0px",
    "buttonVariant": "outline",
    "font": "Inter, sans-serif"
  }'),
  ('lavender', 'Lavender', true, '{
    "bg": "#f5f3ff",
    "text": "#4c1d95",
    "cardBg": "#ede9fe",
    "cardText": "#4c1d95",
    "cardBorder": "#c4b5fd",
    "cardRadius": "16px",
    "buttonVariant": "filled",
    "font": "Inter, sans-serif"
  }'),
  ('brutalist', 'Brutalist', true, '{
    "bg": "#fef08a",
    "text": "#000000",
    "cardBg": "#ffffff",
    "cardText": "#000000",
    "cardBorder": "#000000",
    "cardRadius": "0px",
    "buttonVariant": "filled",
    "font": "Space Mono, monospace"
  }'),
  ('glass', 'Glass', true, '{
    "bg": "linear-gradient(135deg, #667eea, #764ba2)",
    "text": "#ffffff",
    "cardBg": "rgba(255,255,255,0.1)",
    "cardText": "#ffffff",
    "cardBorder": "rgba(255,255,255,0.2)",
    "cardRadius": "16px",
    "buttonVariant": "filled",
    "font": "Inter, sans-serif",
    "backdropBlur": "12px"
  }'),
  ('cherry', 'Cherry', true, '{
    "bg": "#1c1917",
    "text": "#fecdd3",
    "cardBg": "#292524",
    "cardText": "#fecdd3",
    "cardBorder": "#991b1b",
    "cardRadius": "12px",
    "buttonVariant": "filled",
    "font": "Inter, sans-serif"
  }'),
  ('arctic', 'Arctic', true, '{
    "bg": "#f0f9ff",
    "text": "#0c4a6e",
    "cardBg": "#e0f2fe",
    "cardText": "#0c4a6e",
    "cardBorder": "#7dd3fc",
    "cardRadius": "20px",
    "buttonVariant": "filled",
    "font": "Inter, sans-serif"
  }')
on conflict (id) do nothing;

-- 2. Reserved slugs
insert into public.reserved_slugs (slug) values
  ('admin'),
  ('api'),
  ('app'),
  ('auth'),
  ('billing'),
  ('blog'),
  ('contact'),
  ('dashboard'),
  ('docs'),
  ('help'),
  ('login'),
  ('logout'),
  ('onboarding'),
  ('pricing'),
  ('privacy'),
  ('pro'),
  ('profile'),
  ('register'),
  ('settings'),
  ('signup'),
  ('support'),
  ('terms'),
  ('tos'),
  ('about'),
  ('careers'),
  ('legal'),
  ('status'),
  ('www'),
  ('mail'),
  ('ftp'),
  ('lnksy'),
  ('linktree')
on conflict (slug) do nothing;
