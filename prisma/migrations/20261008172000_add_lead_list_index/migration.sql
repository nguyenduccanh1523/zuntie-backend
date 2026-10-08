-- Supports the default CRM list: all records in an organization, newest first.
CREATE INDEX IF NOT EXISTS "leads_organization_id_created_at_idx"
  ON "leads"("organization_id", "created_at" DESC);

-- Supports the default project list: all projects in an organization, newest first.
CREATE INDEX IF NOT EXISTS "projects_organization_id_created_at_idx"
  ON "projects"("organization_id", "created_at" DESC);
