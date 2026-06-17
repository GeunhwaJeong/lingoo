-- Table-level privileges for the API roles.
--
-- RLS decides *which rows* a user may touch; these GRANTs decide whether the
-- role may issue the statement at all. Both are required. Row protection still
-- comes entirely from the policies in 0001 — these grants do not weaken it.
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;

grant execute on all functions in schema public to anon, authenticated;

-- Keep future objects working without re-granting each time.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant execute on functions to anon, authenticated;
