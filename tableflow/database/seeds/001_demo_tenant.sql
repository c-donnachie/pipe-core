-- =====================================================
-- SEED: 001_demo_tenant.sql
-- TABLEFLOW MVP - Datos de demo para tenant de prueba
-- =====================================================

-- Insertar tenant de demo (Pizzería Italiana)
INSERT INTO tenants (
    id,
    name,
    slug,
    business_name,
    phone,
    email,
    address,
    logo_url,
    banner_url,
    settings,
    is_active,
    onboarding_completed
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'Pizzería Italiana',
    'pizzeria-italiana',
    'Pizzería Italiana S.A.',
    '+56912345678',
    'contacto@pizzeriaitaliana.cl',
    'Av. Providencia 1234, Providencia, Santiago',
    'https://example.com/logos/pizzeria-italiana.png',
    'https://example.com/banners/pizzeria-italiana-banner.jpg',
    '{
        "business_hours": {
            "monday": {"open": "11:00", "close": "23:00", "closed": false},
            "tuesday": {"open": "11:00", "close": "23:00", "closed": false},
            "wednesday": {"open": "11:00", "close": "23:00", "closed": false},
            "thursday": {"open": "11:00", "close": "23:00", "closed": false},
            "friday": {"open": "11:00", "close": "00:00", "closed": false},
            "saturday": {"open": "11:00", "close": "00:00", "closed": false},
            "sunday": {"open": "12:00", "close": "22:00", "closed": false}
        },
        "delivery": {
            "enabled": true,
            "min_order": 8000,
            "delivery_fee": 2000,
            "free_delivery_min": 15000,
            "delivery_time": "30-45 minutos",
            "delivery_zones": [
                {"name": "Providencia", "radius": 3000, "fee": 2000},
                {"name": "Las Condes", "radius": 5000, "fee": 3000},
                {"name": "Ñuñoa", "radius": 4000, "fee": 2500}
            ]
        },
        "notifications": {
            "whatsapp": {
                "enabled": true,
                "order_confirmation": true,
                "order_ready": true,
                "delivery_update": true
            },
            "email": {
                "enabled": true,
                "order_confirmation": true,
                "receipt": true
            }
        },
        "payment_methods": ["cash", "transfer", "card"],
        "currency": "CLP",
        "timezone": "America/Santiago"
    }',
    true,
    true
);

-- Insertar suscripción básica para el tenant
INSERT INTO tenant_subscriptions (
    id,
    tenant_id,
    plan_type,
    status,
    billing_cycle,
    amount,
    currency,
    features,
    starts_at,
    ends_at,
    trial_ends_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'basic',
    'active',
    'monthly',
    29900.00,
    'CLP',
    '{
        "max_orders_per_month": 500,
        "max_branches": 2,
        "channels": ["whatsapp"],
        "analytics": true,
        "support": "email",
        "custom_branding": false,
        "api_access": false,
        "integrations": ["whatsapp", "basic_payments"]
    }',
    NOW(),
    NOW() + INTERVAL '1 month',
    NOW() + INTERVAL '14 days'
);

-- Insertar sucursales del restaurante
INSERT INTO branches (
    id,
    tenant_id,
    name,
    address,
    phone,
    latitude,
    longitude,
    is_active,
    is_main,
    delivery_radius,
    delivery_zones
) VALUES 
-- Sucursal principal
(
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'Sucursal Providencia',
    'Av. Providencia 1234, Providencia, Santiago',
    '+56912345678',
    -33.4184,
    -70.6064,
    true,
    true,
    3000,
    '{
        "zones": [
            {"name": "Providencia Centro", "radius": 2000, "fee": 1500},
            {"name": "Providencia Norte", "radius": 3000, "fee": 2000},
            {"name": "Las Condes Sur", "radius": 4000, "fee": 3000}
        ]
    }'
),
-- Sucursal secundaria
(
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440001',
    'Sucursal Las Condes',
    'Av. Apoquindo 4000, Las Condes, Santiago',
    '+56987654321',
    -33.4172,
    -70.5494,
    true,
    false,
    2500,
    '{
        "zones": [
            {"name": "Las Condes Centro", "radius": 2000, "fee": 2000},
            {"name": "Las Condes Norte", "radius": 2500, "fee": 2500},
            {"name": "Vitacura Sur", "radius": 3000, "fee": 3000}
        ]
    }'
);

-- Insertar usuario administrador (simulando integración con Supabase Auth)
INSERT INTO users (
    id,
    tenant_id,
    email,
    phone,
    full_name,
    avatar_url,
    role,
    permissions,
    is_active,
    last_login_at
) VALUES 
-- Dueño del restaurante
(
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440001',
    'marco@pizzeriaitaliana.cl',
    '+56912345678',
    'Marco Rossi',
    'https://example.com/avatars/marco-rossi.jpg',
    'owner',
    '{
        "orders": {"view": true, "create": true, "update": true, "delete": true},
        "menu": {"view": true, "create": true, "update": true, "delete": true},
        "customers": {"view": true, "update": true},
        "analytics": {"view": true},
        "settings": {"view": true, "update": true},
        "users": {"view": true, "create": true, "update": true, "delete": true},
        "subscription": {"view": true, "update": true}
    }',
    true,
    NOW()
),
-- Administrador
(
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440001',
    'admin@pizzeriaitaliana.cl',
    '+56923456789',
    'Ana García',
    'https://example.com/avatars/ana-garcia.jpg',
    'admin',
    '{
        "orders": {"view": true, "create": true, "update": true},
        "menu": {"view": true, "create": true, "update": true},
        "customers": {"view": true, "update": true},
        "analytics": {"view": true},
        "settings": {"view": true},
        "users": {"view": true}
    }',
    true,
    NOW() - INTERVAL '2 hours'
),
-- Staff (cocina)
(
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440001',
    'cocina@pizzeriaitaliana.cl',
    '+56934567890',
    'Carlos Mendoza',
    null,
    'staff',
    '{
        "orders": {"view": true, "update": true},
        "menu": {"view": true}
    }',
    true,
    NOW() - INTERVAL '30 minutes'
);

-- Insertar algunos customers de ejemplo
INSERT INTO customers (
    id,
    phone,
    whatsapp_id,
    name,
    last_delivery_address,
    total_orders,
    total_spent,
    last_order_at
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440008',
    '+56911111111',
    'whatsapp_11111111',
    'Juan Pérez',
    'Av. Libertador 123, Las Condes, Santiago',
    5,
    45000.00,
    NOW() - INTERVAL '3 days'
),
(
    '550e8400-e29b-41d4-a716-446655440009',
    '+56922222222',
    'whatsapp_22222222',
    'María González',
    'Calle Nueva 456, Providencia, Santiago',
    12,
    120000.00,
    NOW() - INTERVAL '1 day'
),
(
    '550e8400-e29b-41d4-a716-446655440010',
    '+56933333333',
    'whatsapp_33333333',
    'Pedro Silva',
    'Av. Apoquindo 789, Las Condes, Santiago',
    2,
    18000.00,
    NOW() - INTERVAL '5 days'
);

-- Insertar programa de lealtad para algunos customers
INSERT INTO customer_loyalty (
    id,
    customer_id,
    tenant_id,
    points,
    lifetime_spent,
    tier
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440001',
    450, -- 1 punto por cada $100 gastado
    45000.00,
    'bronze'
),
(
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440001',
    1200,
    120000.00,
    'silver'
),
(
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440001',
    180,
    18000.00,
    'bronze'
);

-- Insertar algunas conversaciones WhatsApp de ejemplo
INSERT INTO whatsapp_conversations (
    id,
    tenant_id,
    customer_id,
    phone,
    whatsapp_id,
    status,
    last_message_at,
    expires_at,
    context
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440014',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440008',
    '+56911111111',
    'whatsapp_11111111',
    'active',
    NOW() - INTERVAL '10 minutes',
    NOW() + INTERVAL '23 hours 50 minutes',
    '{
        "current_state": "viewing_menu",
        "cart": {
            "items": [],
            "total": 0
        },
        "last_category_viewed": "pizzas",
        "session_start": "2024-01-15T10:30:00Z"
    }'
),
(
    '550e8400-e29b-41d4-a716-446655440015',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440009',
    '+56922222222',
    'whatsapp_22222222',
    'idle',
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '22 hours',
    '{
        "current_state": "order_confirmed",
        "last_order_id": "550e8400-e29b-41d4-a716-446655440020",
        "session_start": "2024-01-15T08:15:00Z"
    }'
);

-- Insertar algunos mensajes WhatsApp de ejemplo
INSERT INTO whatsapp_messages (
    id,
    conversation_id,
    message_id,
    direction,
    content,
    status,
    created_at
) VALUES 
-- Mensajes de la conversación activa
(
    '550e8400-e29b-41d4-a716-446655440016',
    '550e8400-e29b-41d4-a716-446655440014',
    'msg_out_001',
    'outbound',
    '¡Hola Juan! 👋 Bienvenido a Pizzería Italiana. ¿Te gustaría ver nuestro menú de hoy?',
    'delivered',
    NOW() - INTERVAL '15 minutes'
),
(
    '550e8400-e29b-41d4-a716-446655440017',
    '550e8400-e29b-41d4-a716-446655440014',
    'msg_in_001',
    'inbound',
    'Hola, sí me gustaría ver el menú',
    'read',
    NOW() - INTERVAL '12 minutes'
),
(
    '550e8400-e29b-41d4-a716-446655440018',
    '550e8400-e29b-41d4-a716-446655440014',
    'msg_out_002',
    'outbound',
    '¡Perfecto! Aquí tienes nuestras categorías:\n\n🍕 Pizzas\n🍝 Pastas\n🥗 Ensaladas\n🍕 Bebidas\n\n¿Qué te interesa?',
    'delivered',
    NOW() - INTERVAL '10 minutes'
),
-- Mensajes de la conversación inactiva
(
    '550e8400-e29b-41d4-a716-446655440019',
    '550e8400-e29b-41d4-a716-446655440015',
    'msg_out_003',
    'outbound',
    '¡Hola María! Tu pedido #TF-20240115-0001 ha sido confirmado. Tiempo estimado: 35 minutos. ¡Gracias!',
    'delivered',
    NOW() - INTERVAL '2 hours'
);

-- Comentarios para documentar el seed
COMMENT ON TABLE tenants IS 'Datos de demo: Pizzería Italiana con configuración completa';
COMMENT ON TABLE tenant_subscriptions IS 'Datos de demo: Suscripción básica activa con trial';
COMMENT ON TABLE branches IS 'Datos de demo: 2 sucursales con zonas de delivery configuradas';
COMMENT ON TABLE users IS 'Datos de demo: 3 usuarios con diferentes roles y permisos';
COMMENT ON TABLE customers IS 'Datos de demo: 3 customers con historial de pedidos';
COMMENT ON TABLE customer_loyalty IS 'Datos de demo: Programa de lealtad con diferentes tiers';
COMMENT ON TABLE whatsapp_conversations IS 'Datos de demo: 2 conversaciones WhatsApp activas/inactivas';
COMMENT ON TABLE whatsapp_messages IS 'Datos de demo: Mensajes de ejemplo para las conversaciones';
