-- =====================================================
-- INSERTAR TENANT DE PRUEBA
-- Script para crear un tenant de prueba en la tabla tenants
-- =====================================================

-- Insertar tenant de prueba
INSERT INTO tenants (
    tenant_id,
    name,
    description,
    api_key,
    api_secret,
    status,
    settings,
    services
) VALUES (
    'test-tenant',
    'Tenant de Prueba',
    'Tenant creado para pruebas y desarrollo',
    'pk_test_' || substr(md5(random()::text), 1, 16),
    'sk_test_' || substr(md5(random()::text), 1, 32),
    'active',
    '{
        "messaging": {
            "defaultProvider": "resend",
            "fallbackProvider": "sendgrid",
            "retryAttempts": 3,
            "timeout": 30000
        },
        "payments": {
            "defaultProvider": "mercadopago",
            "fallbackProvider": "transbank",
            "currency": "CLP",
            "retryAttempts": 3
        },
        "delivery": {
            "defaultProvider": "uber",
            "fallbackProvider": "rappi",
            "retryAttempts": 3
        },
        "notifications": {
            "webhookUrl": "",
            "emailNotifications": true,
            "smsNotifications": true
        },
        "limits": {
            "maxMessagesPerDay": 10000,
            "maxPaymentsPerDay": 1000,
            "maxDeliveryRequestsPerDay": 500
        }
    }'::jsonb,
    '{
        "delivery": true,
        "messaging": true,
        "payments": true
    }'::jsonb
)
ON CONFLICT (tenant_id) DO UPDATE SET
    updated_at = NOW(),
    status = 'active';

-- Verificar que se insertó correctamente
SELECT 
    tenant_id,
    name,
    api_key,
    LEFT(api_secret, 10) || '...' as api_secret_preview,
    status,
    services,
    created_at
FROM tenants
WHERE tenant_id = 'test-tenant';

