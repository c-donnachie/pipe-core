-- =====================================================
-- TABLA UBER_DIRECT_TOKENS
-- Almacena tokens de acceso de Uber Direct
-- =====================================================

CREATE TABLE IF NOT EXISTS uber_direct_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    access_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas del token más reciente
CREATE INDEX IF NOT EXISTS idx_uber_tokens_created_at ON uber_direct_tokens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uber_tokens_expires_at ON uber_direct_tokens(expires_at);

