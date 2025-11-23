-- =====================================================
-- ELIMINAR COLUMNA tenant_id DE LA TABLA tenants
-- =====================================================

-- Eliminar índices que usan tenant_id
DROP INDEX IF EXISTS idx_tenants_tenant_id;

-- Eliminar la columna tenant_id
ALTER TABLE tenants DROP COLUMN IF EXISTS tenant_id;

-- Nota: Si hay datos existentes, asegúrate de migrar tenant_id a id antes de ejecutar esto
-- O actualizar las referencias en otras tablas que usen tenant_id

