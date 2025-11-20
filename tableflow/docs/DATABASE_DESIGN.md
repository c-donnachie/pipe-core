# TableFlow MVP - Diseño de Base de Datos

## Resumen Ejecutivo

TableFlow MVP es un sistema de pedidos para restaurantes que opera exclusivamente a través de WhatsApp en su fase inicial. La base de datos PostgreSQL está diseñada para soportar un modelo multi-tenant donde cada restaurante (tenant) puede gestionar sus sucursales, menú, pedidos y clientes de forma independiente.

## Características Principales

- **Multi-tenant**: Aislamiento completo de datos por restaurante
- **WhatsApp First**: Optimizado para conversaciones y pedidos via WhatsApp
- **Escalable**: Preparado para agregar más canales (web, app) en el futuro
- **MVP Temporal**: Tabla `customers` simplificada para migración futura
- **Row Level Security**: Políticas de seguridad a nivel de fila
- **Auditoría Completa**: Historial de cambios y estados

## Arquitectura de Datos

### Modelo de Tenancy

```
Tenants (Restaurantes)
├── Branches (Sucursales)
├── Users (Administradores)
├── Categories (Categorías del menú)
│   └── Products (Productos)
│       ├── Product Variants (Variantes/Tamaños)
│       └── Product Modifiers (Extras/Ingredientes)
├── Orders (Pedidos)
│   ├── Order Items (Items del pedido)
│   │   └── Order Item Modifiers (Extras de items)
│   └── Order Status History (Historial de estados)
├── Customers (Clientes - MVP temporal)
├── Customer Loyalty (Programa de lealtad)
└── WhatsApp Integration
    ├── WhatsApp Conversations (Conversaciones)
    └── WhatsApp Messages (Mensajes)
```

## Esquema Detallado

### 1. Gestión de Tenants

#### `tenants` - Restaurantes Principales
```sql
- id: UUID (PK)
- name: VARCHAR(255) - Nombre del restaurante
- slug: VARCHAR(100) UNIQUE - URL amigable
- business_name: VARCHAR(255) - Razón social
- phone, email, address: Contacto
- logo_url, banner_url: URLs de imágenes
- settings: JSONB - Configuración completa del negocio
- is_active, onboarding_completed: Estados
- created_at, updated_at: Timestamps
```

**Configuración JSONB (`settings`):**
```json
{
  "business_hours": { /* horarios por día */ },
  "delivery": {
    "enabled": true,
    "min_order": 8000,
    "delivery_fee": 2000,
    "free_delivery_min": 15000,
    "delivery_zones": [ /* zonas de entrega */ ]
  },
  "notifications": { /* configuración de notificaciones */ },
  "payment_methods": ["cash", "transfer", "card"],
  "currency": "CLP",
  "timezone": "America/Santiago"
}
```

#### `tenant_subscriptions` - Planes de Suscripción
```sql
- id: UUID (PK)
- tenant_id: UUID (FK → tenants)
- plan_type: ENUM (free/basic/premium/enterprise)
- status: ENUM (active/cancelled/expired/trial)
- billing_cycle: ENUM (monthly/yearly)
- amount: DECIMAL(10,2)
- features: JSONB - Características del plan
- starts_at, ends_at, trial_ends_at: Fechas
```

#### `branches` - Sucursales
```sql
- id: UUID (PK)
- tenant_id: UUID (FK → tenants)
- name: VARCHAR(255)
- address, phone: Ubicación y contacto
- latitude, longitude: Coordenadas GPS
- is_active, is_main: Estados
- delivery_radius: INTEGER (metros)
- delivery_zones: JSONB - Zonas específicas
```

### 2. Usuarios y Clientes

#### `users` - Administradores del Restaurante
```sql
- id: UUID (PK) - Referencia a Supabase Auth
- tenant_id: UUID (FK → tenants) - nullable para super admins
- email: VARCHAR(255) UNIQUE
- phone, full_name, avatar_url: Datos personales
- role: ENUM (owner/admin/staff)
- permissions: JSONB - Permisos granulares
- is_active, last_login_at: Estados y actividad
```

#### `customers` - Clientes MVP (Temporal)
```sql
- id: UUID (PK)
- phone: VARCHAR(20) UNIQUE - Registro automático por WhatsApp
- whatsapp_id: VARCHAR(100) - ID del proveedor
- name: VARCHAR(255) - Se captura durante conversación
- last_delivery_address: TEXT
- total_orders, total_spent: Estadísticas
- created_at, updated_at, last_order_at: Timestamps
```

**⚠️ IMPORTANTE:** Esta tabla es temporal para el MVP. Los datos se migrarán a un sistema de autenticación completo en la Fase 2.

#### `customer_loyalty` - Programa de Lealtad
```sql
- id: UUID (PK)
- customer_id: UUID (FK → customers)
- tenant_id: UUID (FK → tenants)
- points: INTEGER - Puntos acumulados
- lifetime_spent: DECIMAL(10,2) - Gasto total
- tier: ENUM (bronze/silver/gold) - Nivel de cliente
```

### 3. Menú e Inventario

#### `categories` - Categorías del Menú
```sql
- id: UUID (PK)
- tenant_id: UUID (FK → tenants)
- name: VARCHAR(255)
- description, icon_url: Descripción e icono
- display_order: INTEGER - Orden de visualización
- is_active: BOOLEAN
```

#### `products` - Productos
```sql
- id: UUID (PK)
- tenant_id: UUID (FK → tenants)
- category_id: UUID (FK → categories)
- name, description, image_url: Información básica
- price: DECIMAL(10,2) - Precio base
- discount_price: DECIMAL(10,2) - Precio con descuento
- preparation_time: INTEGER (minutos)
- is_available: BOOLEAN - Control manual
- inventory_count: INTEGER - Solo si track_inventory=true
- track_inventory: BOOLEAN - Control de inventario
- tags: JSONB - Etiquetas (vegetariano, picante, etc.)
```

#### `product_variants` - Variantes/Tamaños
```sql
- id: UUID (PK)
- product_id: UUID (FK → products)
- name: VARCHAR(100) - "Pequeño", "Mediano", "Grande"
- price_modifier: DECIMAL(10,2) - Modificador de precio
- is_available: BOOLEAN
```

#### `product_modifiers` - Extras/Ingredientes
```sql
- id: UUID (PK)
- product_id: UUID (FK → products)
- name: VARCHAR(255)
- price: DECIMAL(10,2)
- is_required: BOOLEAN - Obligatorio
- max_selections: INTEGER - Máximo selecciones
- is_available: BOOLEAN
```

### 4. Pedidos

#### `orders` - Pedidos Principales
```sql
- id: UUID (PK)
- tenant_id: UUID (FK → tenants)
- branch_id: UUID (FK → branches)
- customer_id: UUID (FK → customers)
- order_number: VARCHAR(50) UNIQUE - "TF-YYYYMMDD-0001"
- channel: ENUM (whatsapp/web/phone) - Canal de origen
- status: ENUM (pending/confirmed/preparing/ready/delivered/cancelled)
- subtotal, delivery_fee, discount, total: DECIMAL(10,2)
- payment_method: ENUM (cash/transfer/card)
- payment_status: ENUM (pending/paid/failed)
- delivery_type: ENUM (delivery/pickup/dine-in)
- delivery_address, delivery_notes: TEXT
- scheduled_for: TIMESTAMP - Pedido programado
- whatsapp_conversation_id: UUID
- created_at, updated_at, confirmed_at, delivered_at: Timestamps
```

#### `order_items` - Items del Pedido
```sql
- id: UUID (PK)
- order_id: UUID (FK → orders)
- product_id: UUID (FK → products)
- product_variant_id: UUID (FK → product_variants) - nullable
- quantity: INTEGER
- unit_price, subtotal: DECIMAL(10,2)
- notes: TEXT - Instrucciones especiales
```

#### `order_item_modifiers` - Extras de Items
```sql
- id: UUID (PK)
- order_item_id: UUID (FK → order_items)
- modifier_id: UUID (FK → product_modifiers)
- quantity: INTEGER
- unit_price: DECIMAL(10,2)
```

#### `order_status_history` - Historial de Estados
```sql
- id: UUID (PK)
- order_id: UUID (FK → orders)
- status: VARCHAR(20)
- notes: TEXT
- changed_by: UUID (FK → users) - nullable para cambios automáticos
- created_at: TIMESTAMP
```

### 5. Integración WhatsApp

#### `whatsapp_conversations` - Conversaciones
```sql
- id: UUID (PK)
- tenant_id: UUID (FK → tenants)
- customer_id: UUID (FK → customers)
- phone: VARCHAR(20) - Número de teléfono
- whatsapp_id: VARCHAR(100) - ID del proveedor
- status: ENUM (active/idle/closed)
- last_message_at: TIMESTAMP
- expires_at: TIMESTAMP - Expiración (24h después del último mensaje)
- context: JSONB - Estado de la conversación
```

**Context JSONB:**
```json
{
  "current_state": "selecting_menu",
  "cart": {
    "items": [],
    "total": 0
  },
  "last_category_viewed": "pizzas",
  "session_start": "2024-01-15T10:30:00Z"
}
```

#### `whatsapp_messages` - Mensajes
```sql
- id: UUID (PK)
- conversation_id: UUID (FK → whatsapp_conversations)
- message_id: VARCHAR(255) - ID del proveedor
- direction: ENUM (inbound/outbound)
- content: TEXT - Contenido del mensaje
- media_url: TEXT - URL de medios adjuntos
- status: ENUM (sent/delivered/read/failed)
- created_at: TIMESTAMP
```

## Características Técnicas

### Row Level Security (RLS)

Todas las tablas multi-tenant tienen RLS habilitado con políticas que:

1. **Aíslan datos por tenant**: Los usuarios solo ven datos de su restaurante
2. **Permiten super admins**: Acceso completo con `tenant_id = NULL`
3. **Protegen relaciones**: Las políticas consideran las relaciones FK

**Función auxiliar:**
```sql
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT tenant_id 
        FROM users 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Índices Optimizados

```sql
-- Búsquedas frecuentes
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_orders_tenant_created ON orders(tenant_id, created_at);
CREATE INDEX idx_products_tenant_active ON products(tenant_id, is_available);
CREATE INDEX idx_whatsapp_conversations_phone ON whatsapp_conversations(phone);

-- Foreign keys
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
```

### Funciones Auxiliares

#### Generación de Número de Pedido
```sql
CREATE OR REPLACE FUNCTION generate_order_number(tenant_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    today_date TEXT;
    sequence_num INTEGER;
    order_num TEXT;
BEGIN
    today_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SPLIT_PART(order_number, '-', 3) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM orders 
    WHERE tenant_id = tenant_uuid 
    AND order_number LIKE 'TF-' || today_date || '-%';
    
    order_num := 'TF-' || today_date || '-' || LPAD(sequence_num::TEXT, 4, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;
```

### Triggers Automáticos

**Updated_at automático:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicado a todas las tablas con updated_at
CREATE TRIGGER trigger_tenants_updated_at 
    BEFORE UPDATE ON tenants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Views para Reportes

### `active_orders` - Pedidos Activos
```sql
CREATE VIEW active_orders AS
SELECT 
    o.id, o.order_number, t.name as tenant_name,
    b.name as branch_name, c.phone as customer_phone,
    c.name as customer_name, o.status, o.total, o.created_at
FROM orders o
JOIN tenants t ON o.tenant_id = t.id
LEFT JOIN branches b ON o.branch_id = b.id
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.status NOT IN ('delivered', 'cancelled')
ORDER BY o.created_at DESC;
```

### `daily_sales` - Ventas Diarias
```sql
CREATE VIEW daily_sales AS
SELECT 
    t.id as tenant_id, t.name as tenant_name,
    DATE(o.created_at) as sale_date,
    COUNT(*) as total_orders,
    SUM(o.total) as total_revenue,
    AVG(o.total) as average_order_value
FROM orders o
JOIN tenants t ON o.tenant_id = t.id
WHERE o.status = 'delivered'
GROUP BY t.id, t.name, DATE(o.created_at)
ORDER BY sale_date DESC, total_revenue DESC;
```

### `popular_products` - Productos Populares
```sql
CREATE VIEW popular_products AS
SELECT 
    p.id, p.name as product_name, t.name as tenant_name,
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
```

## Flujo de Datos WhatsApp

### 1. Inicio de Conversación
```
Cliente envía mensaje → WhatsApp → PipeCore API → TableFlow DB
1. Crear/actualizar customer (si no existe)
2. Crear/actualizar conversation
3. Procesar mensaje y actualizar context
4. Responder con menú/categorías
```

### 2. Selección de Productos
```
Cliente selecciona producto → Actualizar context.cart
1. Validar disponibilidad del producto
2. Agregar item al carrito temporal
3. Mostrar resumen y opciones (continuar/finalizar)
```

### 3. Confirmación de Pedido
```
Cliente confirma pedido → Crear order
1. Generar order_number único
2. Crear order_items y order_item_modifiers
3. Calcular totales (subtotal + delivery_fee - discount)
4. Crear order_status_history
5. Enviar confirmación al cliente
```

### 4. Seguimiento de Estado
```
Restaurante cambia estado → Actualizar order y history
1. Actualizar orders.status
2. Crear registro en order_status_history
3. Notificar cliente (si está configurado)
4. Actualizar customer.total_orders y total_spent
```

## Consideraciones de Escalabilidad

### Preparado para Futuro
1. **Múltiples canales**: Campo `channel` en orders permite agregar web/app
2. **Auth completo**: Tabla customers temporal, lista para migración
3. **Multi-idioma**: JSONB en settings permite configuración por idioma
4. **Analytics**: Views preparadas para dashboards y reportes

### Optimizaciones Futuras
1. **Particionado**: Por fecha en orders para grandes volúmenes
2. **Read replicas**: Para consultas de reportes
3. **Caching**: Redis para menús frecuentemente consultados
4. **Archiving**: Tabla histórica para orders antiguos

## Datos de Demo

El sistema incluye datos de ejemplo para una "Pizzería Italiana" con:

- **1 tenant** con configuración completa
- **2 sucursales** con zonas de delivery
- **3 usuarios** con diferentes roles
- **3 customers** con historial de pedidos
- **5 categorías** de menú
- **20 productos** con variantes y modificadores
- **2 pedidos completados** con historial completo
- **Conversaciones WhatsApp** de ejemplo

## Migración y Mantenimiento

### Scripts Incluidos
1. `001_initial_schema.sql` - Schema completo inicial
2. `002_rls_policies.sql` - Políticas de seguridad
3. `001_demo_tenant.sql` - Datos de tenant de ejemplo
4. `002_demo_menu.sql` - Menú completo de ejemplo

### Próximos Pasos
1. **Fase 2**: Migración de customers a sistema auth completo
2. **Fase 3**: Integración de canales web y móvil
3. **Fase 4**: Analytics avanzados y machine learning
4. **Fase 5**: Multi-idioma y internacionalización

---

*Este diseño está optimizado para el MVP de TableFlow con pedidos via WhatsApp, pero preparado para escalar a un sistema completo de gestión de restaurantes.*
