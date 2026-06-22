-- Erase all application data while keeping tables, columns, and migrations intact.
DO $$
DECLARE
  tables TEXT;
BEGIN
  SELECT string_agg(quote_ident(tablename), ', ')
  INTO tables
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT IN ('_prisma_migrations');

  IF tables IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || tables || ' RESTART IDENTITY CASCADE';
  END IF;
END $$;
