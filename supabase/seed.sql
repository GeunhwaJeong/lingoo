-- Seed the languages reference table with common languages.
insert into public.languages (code, name, native_name, is_rtl) values
  ('en', 'English',    'English',  false),
  ('ko', 'Korean',     '한국어',     false),
  ('ja', 'Japanese',   '日本語',     false),
  ('zh', 'Chinese',    '中文',       false),
  ('es', 'Spanish',    'Español',   false),
  ('fr', 'French',     'Français',  false),
  ('de', 'German',     'Deutsch',   false),
  ('pt', 'Portuguese', 'Português', false),
  ('ru', 'Russian',    'Русский',   false),
  ('it', 'Italian',    'Italiano',  false),
  ('ar', 'Arabic',     'العربية',    true),
  ('he', 'Hebrew',     'עברית',      true),
  ('vi', 'Vietnamese', 'Tiếng Việt',false),
  ('th', 'Thai',       'ไทย',        false),
  ('id', 'Indonesian', 'Bahasa Indonesia', false)
on conflict (code) do nothing;
