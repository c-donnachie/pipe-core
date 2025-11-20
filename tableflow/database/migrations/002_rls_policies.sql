-- =====================================================
-- MIGRATION: 002_rls_policies.sql
-- TABLEFLOW MVP - Row Level Security Policies
-- =====================================================

-- Habilitar RLS en todas las tablas multi-tenant
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNCIÓN AUXILIAR PARA OBTENER TENANT_ID
-- =====================================================

-- Función para obtener el tenant_id del usuario autenticado
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    -- En Supabase, esto se puede obtener de auth.users o de la tabla users
    -- Por ahora, retornamos null para permitir acceso a super admins
    RETURN (
        SELECT tenant_id 
        FROM users 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLÍTICAS PARA TENANTS
-- =====================================================

-- Los usuarios solo pueden ver/editar su propio tenant
CREATE POLICY "Users can view own tenant" ON tenants
    FOR SELECT USING (
        id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can update own tenant" ON tenants
    FOR UPDATE USING (
        id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can insert own tenant" ON tenants
    FOR INSERT WITH CHECK (
        id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

-- =====================================================
-- POLÍTICAS PARA TENANT_SUBSCRIPTIONS
-- =====================================================

CREATE POLICY "Users can view own tenant subscriptions" ON tenant_subscriptions
    FOR SELECT USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can update own tenant subscriptions" ON tenant_subscriptions
    FOR UPDATE USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can insert own tenant subscriptions" ON tenant_subscriptions
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

-- =====================================================
-- POLÍTICAS PARA BRANCHES
-- =====================================================

CREATE POLICY "Users can view own tenant branches" ON branches
    FOR SELECT USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can update own tenant branches" ON branches
    FOR UPDATE USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can insert own tenant branches" ON branches
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can delete own tenant branches" ON branches
    FOR DELETE USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

-- =====================================================
-- POLÍTICAS PARA USERS
-- =====================================================

CREATE POLICY "Users can view own tenant users" ON users
    FOR SELECT USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL OR
        id = auth.uid() -- Pueden ver su propio perfil
    );

CREATE POLICY "Users can update own tenant users" ON users
    FOR UPDATE USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL OR
        id = auth.uid() -- Pueden actualizar su propio perfil
    );

CREATE POLICY "Users can insert own tenant users" ON users
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

-- =====================================================
-- POLÍTICAS PARA CUSTOMERS
-- =====================================================

-- Los customers están asociados a tenants a través de orders
-- Por simplicidad, permitimos acceso a todos los customers
-- pero en la práctica se filtrará por tenant a través de las consultas
CREATE POLICY "Users can view customers" ON customers
    FOR SELECT USING (true);

CREATE POLICY "Users can insert customers" ON customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update customers" ON customers
    FOR UPDATE USING (true);

-- =====================================================
-- POLÍTICAS PARA CUSTOMER_LOYALTY
-- =====================================================

CREATE POLICY "Users can view own tenant loyalty" ON customer_loyalty
    FOR SELECT USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can update own tenant loyalty" ON customer_loyalty
    FOR UPDATE USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can insert own tenant loyalty" ON customer_loyalty
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

-- =====================================================
-- POLÍTICAS PARA CATEGORIES
-- =====================================================

CREATE POLICY "Users can view own tenant categories" ON categories
    FOR SELECT USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can update own tenant categories" ON categories
    FOR UPDATE USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can insert own tenant categories" ON categories
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can delete own tenant categories" ON categories
    FOR DELETE USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

-- =====================================================
-- POLÍTICAS PARA PRODUCTS
-- =====================================================

CREATE POLICY "Users can view own tenant products" ON products
    FOR SELECT USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can update own tenant products" ON products
    FOR UPDATE USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can insert own tenant products" ON products
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can delete own tenant products" ON products
    FOR DELETE USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

-- =====================================================
-- POLÍTICAS PARA PRODUCT_VARIANTS
-- =====================================================

CREATE POLICY "Users can view own tenant product variants" ON product_variants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_variants.product_id 
            AND p.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can update own tenant product variants" ON product_variants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_variants.product_id 
            AND p.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can insert own tenant product variants" ON product_variants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_variants.product_id 
            AND p.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can delete own tenant product variants" ON product_variants
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_variants.product_id 
            AND p.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

-- =====================================================
-- POLÍTICAS PARA PRODUCT_MODIFIERS
-- =====================================================

CREATE POLICY "Users can view own tenant product modifiers" ON product_modifiers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_modifiers.product_id 
            AND p.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can update own tenant product modifiers" ON product_modifiers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_modifiers.product_id 
            AND p.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can insert own tenant product modifiers" ON product_modifiers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_modifiers.product_id 
            AND p.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can delete own tenant product modifiers" ON product_modifiers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_modifiers.product_id 
            AND p.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

-- =====================================================
-- POLÍTICAS PARA ORDERS
-- =====================================================

CREATE POLICY "Users can view own tenant orders" ON orders
    FOR SELECT USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can update own tenant orders" ON orders
    FOR UPDATE USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can insert own tenant orders" ON orders
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

-- =====================================================
-- POLÍTICAS PARA ORDER_ITEMS
-- =====================================================

CREATE POLICY "Users can view own tenant order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_items.order_id 
            AND o.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can update own tenant order items" ON order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_items.order_id 
            AND o.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can insert own tenant order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_items.order_id 
            AND o.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

-- =====================================================
-- POLÍTICAS PARA ORDER_ITEM_MODIFIERS
-- =====================================================

CREATE POLICY "Users can view own tenant order item modifiers" ON order_item_modifiers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.id = order_item_modifiers.order_item_id 
            AND o.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can update own tenant order item modifiers" ON order_item_modifiers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.id = order_item_modifiers.order_item_id 
            AND o.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can insert own tenant order item modifiers" ON order_item_modifiers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.id = order_item_modifiers.order_item_id 
            AND o.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

-- =====================================================
-- POLÍTICAS PARA ORDER_STATUS_HISTORY
-- =====================================================

CREATE POLICY "Users can view own tenant order status history" ON order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_status_history.order_id 
            AND o.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can insert own tenant order status history" ON order_status_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_status_history.order_id 
            AND o.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

-- =====================================================
-- POLÍTICAS PARA WHATSAPP_CONVERSATIONS
-- =====================================================

CREATE POLICY "Users can view own tenant whatsapp conversations" ON whatsapp_conversations
    FOR SELECT USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can update own tenant whatsapp conversations" ON whatsapp_conversations
    FOR UPDATE USING (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can insert own tenant whatsapp conversations" ON whatsapp_conversations
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant_id() OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

-- =====================================================
-- POLÍTICAS PARA WHATSAPP_MESSAGES
-- =====================================================

CREATE POLICY "Users can view own tenant whatsapp messages" ON whatsapp_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM whatsapp_conversations wc 
            WHERE wc.id = whatsapp_messages.conversation_id 
            AND wc.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

CREATE POLICY "Users can insert own tenant whatsapp messages" ON whatsapp_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_conversations wc 
            WHERE wc.id = whatsapp_messages.conversation_id 
            AND wc.tenant_id = get_user_tenant_id()
        ) OR 
        get_user_tenant_id() IS NULL -- Super admin
    );

-- =====================================================
-- POLÍTICAS PARA VIEWS (si es necesario)
-- =====================================================

-- Las vistas heredan las políticas de las tablas subyacentes
-- No es necesario crear políticas específicas para las vistas

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

-- 1. Las políticas asumen que auth.uid() retorna el UUID del usuario autenticado
-- 2. get_user_tenant_id() debe ser modificada según la implementación de auth
-- 3. Para super admins, se puede usar un tenant_id específico o null
-- 4. Las políticas de customers son más permisivas por simplicidad del MVP
-- 5. En producción, considerar políticas más restrictivas según necesidades de seguridad
