-- =====================================================
-- MIGRATION: 001_initial_schema.sql
-- TABLEFLOW MVP - Schema inicial completo
-- =====================================================

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. GESTIÓN DE TENANTS Y SUSCRIPCIONES
-- =====================================================

-- Tabla de restaurantes (tenants principales)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    business_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    logo_url TEXT,
    banner_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de suscripciones para restaurantes
CREATE TABLE tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) CHECK (plan_type IN ('free', 'basic', 'premium', 'enterprise')),
    status VARCHAR(20) CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
    billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly')),
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'CLP',
    features JSONB DEFAULT '{}',
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de sucursales
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active BOOLEAN DEFAULT true,
    is_main BOOLEAN DEFAULT false,
    delivery_radius INTEGER,
    delivery_zones JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. USUARIOS ADMIN + CUSTOMERS MVP
-- =====================================================

-- Tabla de administradores del restaurante
CREATE TABLE users (
    id UUID PRIMARY KEY, -- Referencia a Supabase Auth
    tenant_id UUID REFERENCES tenants(id), -- nullable para super admins
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(20) CHECK (role IN ('owner', 'admin', 'staff')),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de clientes MVP (temporal - solo WhatsApp)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL, -- registro automático
    whatsapp_id VARCHAR(100), -- ID del proveedor, nullable
    name VARCHAR(255), -- se captura durante conversación, nullable
    last_delivery_address TEXT, -- nullable
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_order_at TIMESTAMP WITH TIME ZONE
);

-- Comentario: Tabla temporal MVP. Datos se migrarán a sistema auth completo en fase 2
COMMENT ON TABLE customers IS 'Tabla temporal MVP. Datos se migrarán a sistema auth completo en fase 2';

-- Tabla de lealtad básica (opcional)
CREATE TABLE customer_loyalty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    lifetime_spent DECIMAL(10,2) DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, tenant_id)
);

-- =====================================================
-- 3. MENÚ E INVENTARIO
-- =====================================================

-- Tabla de categorías
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    discount_price DECIMAL(10,2) CHECK (discount_price >= 0),
    preparation_time INTEGER, -- minutos
    is_available BOOLEAN DEFAULT true, -- control manual
    inventory_count INTEGER, -- nullable, solo si track_inventory=true
    track_inventory BOOLEAN DEFAULT false,
    tags JSONB DEFAULT '{}', -- vegetariano, picante, nuevo, popular
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de variantes de productos (tamaños/opciones)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- pequeño/mediano/grande
    price_modifier DECIMAL(10,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de modificadores (extras/ingredientes)
CREATE TABLE product_modifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0 CHECK (price >= 0),
    is_required BOOLEAN DEFAULT false,
    max_selections INTEGER DEFAULT 1,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. PEDIDOS
-- =====================================================

-- Tabla principal de pedidos
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    customer_id UUID REFERENCES customers(id),
    order_number VARCHAR(50) NOT NULL, -- generado: TF-YYYYMMDD-0001
    channel VARCHAR(20) DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'web', 'phone')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee DECIMAL(10,2) DEFAULT 0 CHECK (delivery_fee >= 0),
    discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'transfer', 'card')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    delivery_type VARCHAR(20) CHECK (delivery_type IN ('delivery', 'pickup', 'dine-in')),
    delivery_address TEXT,
    delivery_notes TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    whatsapp_conversation_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, order_number)
);

-- Tabla de items del pedido
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    notes TEXT, -- instrucciones especiales
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de modificadores de items
CREATE TABLE order_item_modifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    modifier_id UUID REFERENCES product_modifiers(id),
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de historial de estados
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES users(id), -- nullable para cambios automáticos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. INTEGRACIÓN WHATSAPP
-- =====================================================

-- Tabla de conversaciones WhatsApp
CREATE TABLE whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    phone VARCHAR(20) NOT NULL,
    whatsapp_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'idle', 'closed')),
    last_message_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- 24h después del último mensaje
    context JSONB DEFAULT '{}', -- estado: selecting_menu, confirming_order, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de mensajes WhatsApp
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    message_id VARCHAR(255), -- ID del proveedor
    direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
    content TEXT,
    media_url TEXT,
    status VARCHAR(20) CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES OPTIMIZADOS
-- =====================================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_tenant_created ON orders(tenant_id, created_at);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_products_tenant_active ON products(tenant_id, is_available);
CREATE INDEX idx_categories_tenant_order ON categories(tenant_id, display_order);
CREATE INDEX idx_whatsapp_conversations_phone ON whatsapp_conversations(phone);
CREATE INDEX idx_whatsapp_conversations_tenant ON whatsapp_conversations(tenant_id);
CREATE INDEX idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_item_modifiers_item ON order_item_modifiers(order_item_id);

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para generar número de pedido único por tenant
CREATE OR REPLACE FUNCTION generate_order_number(tenant_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    today_date TEXT;
    sequence_num INTEGER;
    order_num TEXT;
BEGIN
    -- Formato: TF-YYYYMMDD-0001
    today_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Obtener el siguiente número secuencial para hoy
    SELECT COALESCE(MAX(CAST(SPLIT_PART(order_number, '-', 3) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM orders 
    WHERE tenant_id = tenant_uuid 
    AND order_number LIKE 'TF-' || today_date || '-%';
    
    -- Formatear con padding de ceros
    order_num := 'TF-' || today_date || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Función genérica para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers a todas las tablas con updated_at
CREATE TRIGGER trigger_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_tenant_subscriptions_updated_at BEFORE UPDATE ON tenant_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_customer_loyalty_updated_at BEFORE UPDATE ON customer_loyalty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_product_modifiers_updated_at BEFORE UPDATE ON product_modifiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_whatsapp_conversations_updated_at BEFORE UPDATE ON whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS PARA REPORTES COMUNES
-- =====================================================

-- Vista de pedidos activos
CREATE VIEW active_orders AS
SELECT 
    o.id,
    o.order_number,
    t.name as tenant_name,
    b.name as branch_name,
    c.phone as customer_phone,
    c.name as customer_name,
    o.status,
    o.total,
    o.created_at
FROM orders o
JOIN tenants t ON o.tenant_id = t.id
LEFT JOIN branches b ON o.branch_id = b.id
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.status NOT IN ('delivered', 'cancelled')
ORDER BY o.created_at DESC;

-- Vista de ventas diarias
CREATE VIEW daily_sales AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    DATE(o.created_at) as sale_date,
    COUNT(*) as total_orders,
    SUM(o.total) as total_revenue,
    AVG(o.total) as average_order_value
FROM orders o
JOIN tenants t ON o.tenant_id = t.id
WHERE o.status = 'delivered'
GROUP BY t.id, t.name, DATE(o.created_at)
ORDER BY sale_date DESC, total_revenue DESC;

-- Vista de productos populares
CREATE VIEW popular_products AS
SELECT 
    p.id,
    p.name as product_name,
    t.name as tenant_name,
    COUNT(oi.id) as times_ordered,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.subtotal) as total_revenue
FROM products p
JOIN tenants t ON p.tenant_id = t.id
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'delivered'
GROUP BY p.id, p.name, t.name
ORDER BY times_ordered DESC, total_revenue DESC;
