# Plan de Migración - Fase 2: Sistema de Autenticación Completo

## Resumen

Este documento describe el plan para migrar de la tabla `customers` temporal del MVP a un sistema de autenticación completo que permita a los clientes finales registrarse, autenticarse y gestionar su información de forma independiente.

## Estado Actual (MVP)

### Tabla `customers` Temporal
```sql
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
```

**Limitaciones del MVP:**
- Solo registro por número de WhatsApp
- Sin autenticación real
- Sin gestión de contraseñas
- Sin verificación de email
- Sin recuperación de cuenta
- Sin perfiles de usuario completos

## Estado Objetivo (Fase 2)

### Nuevo Sistema de Autenticación
- **Supabase Auth** como proveedor principal
- **Registro múltiple**: WhatsApp, email, Google, Apple
- **Gestión completa de perfiles**
- **Historial de pedidos detallado**
- **Preferencias y configuraciones**
- **Sistema de notificaciones**

## Plan de Migración

### Fase 2.1: Preparación (Semana 1-2)

#### 1. Análisis de Datos Existentes
```sql
-- Script de análisis
SELECT 
    COUNT(*) as total_customers,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as customers_with_names,
    COUNT(CASE WHEN last_delivery_address IS NOT NULL THEN 1 END) as customers_with_addresses,
    AVG(total_orders) as avg_orders_per_customer,
    SUM(total_spent) as total_revenue
FROM customers;
```

#### 2. Backup de Datos Críticos
```sql
-- Crear tabla de backup
CREATE TABLE customers_backup AS 
SELECT * FROM customers;

-- Crear tabla de backup para relaciones
CREATE TABLE customer_relationships_backup AS
SELECT 
    c.id as old_customer_id,
    c.phone,
    c.name,
    COUNT(o.id) as total_orders,
    SUM(o.total) as total_spent
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.phone, c.name;
```

#### 3. Preparar Nuevas Tablas
```sql
-- Tabla de perfiles extendidos
CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(20) UNIQUE, -- Mantener compatibilidad con WhatsApp
    whatsapp_id VARCHAR(100),
    full_name VARCHAR(255),
    birth_date DATE,
    gender VARCHAR(20),
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de direcciones
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
    label VARCHAR(100), -- "Casa", "Trabajo", etc.
    address TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_default BOOLEAN DEFAULT false,
    delivery_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de métodos de pago
CREATE TABLE customer_payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
    type VARCHAR(50), -- "card", "bank_transfer", "cash"
    provider VARCHAR(50), -- "visa", "mastercard", "bci", etc.
    last_four_digits VARCHAR(4),
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de favoritos
CREATE TABLE customer_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_profile_id, product_id)
);

-- Tabla de historial de pedidos (vista detallada)
CREATE TABLE customer_order_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_summary JSONB, -- Resumen del pedido para fácil acceso
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Fase 2.2: Migración de Datos (Semana 3-4)

#### 1. Script de Migración Principal
```sql
-- Función de migración
CREATE OR REPLACE FUNCTION migrate_customers_to_auth()
RETURNS TABLE (
    old_customer_id UUID,
    new_user_id UUID,
    migration_status TEXT
) AS $$
DECLARE
    customer_record RECORD;
    new_user_id UUID;
    new_profile_id UUID;
    migration_status TEXT;
BEGIN
    -- Iterar sobre todos los customers existentes
    FOR customer_record IN 
        SELECT * FROM customers 
        WHERE phone IS NOT NULL
    LOOP
        BEGIN
            -- Crear usuario en Supabase Auth (esto se haría desde la aplicación)
            -- new_user_id := create_auth_user(customer_record.phone, customer_record.name);
            
            -- Por ahora, simular con un UUID
            new_user_id := uuid_generate_v4();
            
            -- Crear perfil extendido
            INSERT INTO customer_profiles (
                user_id,
                phone,
                whatsapp_id,
                full_name
            ) VALUES (
                new_user_id,
                customer_record.phone,
                customer_record.whatsapp_id,
                customer_record.name
            ) RETURNING id INTO new_profile_id;
            
            -- Migrar última dirección de entrega si existe
            IF customer_record.last_delivery_address IS NOT NULL THEN
                INSERT INTO customer_addresses (
                    customer_profile_id,
                    label,
                    address,
                    is_default
                ) VALUES (
                    new_profile_id,
                    'Última dirección',
                    customer_record.last_delivery_address,
                    true
                );
            END IF;
            
            -- Crear historial de pedidos
            INSERT INTO customer_order_history (
                customer_profile_id,
                order_id,
                order_summary
            )
            SELECT 
                new_profile_id,
                o.id,
                jsonb_build_object(
                    'order_number', o.order_number,
                    'total', o.total,
                    'status', o.status,
                    'created_at', o.created_at,
                    'delivery_address', o.delivery_address
                )
            FROM orders o
            WHERE o.customer_id = customer_record.id;
            
            migration_status := 'success';
            
        EXCEPTION
            WHEN OTHERS THEN
                migration_status := 'error: ' || SQLERRM;
                new_user_id := NULL;
        END;
        
        -- Retornar resultado
        RETURN QUERY SELECT 
            customer_record.id,
            new_user_id,
            migration_status;
            
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

#### 2. Actualización de Relaciones
```sql
-- Actualizar orders para referenciar nuevos customer_profiles
CREATE OR REPLACE FUNCTION update_order_customer_references()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    order_record RECORD;
    new_customer_profile_id UUID;
BEGIN
    FOR order_record IN 
        SELECT o.id, o.customer_id, c.phone
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
    LOOP
        -- Buscar el nuevo customer_profile_id
        SELECT cp.id INTO new_customer_profile_id
        FROM customer_profiles cp
        WHERE cp.phone = order_record.phone
        LIMIT 1;
        
        IF new_customer_profile_id IS NOT NULL THEN
            -- Actualizar la referencia (esto requeriría agregar la columna)
            -- UPDATE orders SET customer_profile_id = new_customer_profile_id WHERE id = order_record.id;
            updated_count := updated_count + 1;
        END IF;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
```

### Fase 2.3: Actualización de Esquema (Semana 5-6)

#### 1. Nuevas Columnas en Tablas Existentes
```sql
-- Agregar referencia a customer_profiles en orders
ALTER TABLE orders 
ADD COLUMN customer_profile_id UUID REFERENCES customer_profiles(id);

-- Crear índice para la nueva columna
CREATE INDEX idx_orders_customer_profile ON orders(customer_profile_id);

-- Actualizar whatsapp_conversations
ALTER TABLE whatsapp_conversations 
ADD COLUMN customer_profile_id UUID REFERENCES customer_profiles(id);

CREATE INDEX idx_whatsapp_conversations_customer_profile ON whatsapp_conversations(customer_profile_id);

-- Actualizar customer_loyalty
ALTER TABLE customer_loyalty 
ADD COLUMN customer_profile_id UUID REFERENCES customer_profiles(id);

CREATE INDEX idx_customer_loyalty_customer_profile ON customer_loyalty(customer_profile_id);
```

#### 2. Nuevas Políticas RLS
```sql
-- Políticas para customer_profiles
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON customer_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON customer_profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON customer_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas para customer_addresses
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses" ON customer_addresses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM customer_profiles cp 
            WHERE cp.id = customer_addresses.customer_profile_id 
            AND cp.user_id = auth.uid()
        )
    );

-- Políticas para customer_payment_methods
ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payment methods" ON customer_payment_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM customer_profiles cp 
            WHERE cp.id = customer_payment_methods.customer_profile_id 
            AND cp.user_id = auth.uid()
        )
    );

-- Políticas para customer_favorites
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites" ON customer_favorites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM customer_profiles cp 
            WHERE cp.id = customer_favorites.customer_profile_id 
            AND cp.user_id = auth.uid()
        )
    );

-- Políticas para customer_order_history
ALTER TABLE customer_order_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order history" ON customer_order_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customer_profiles cp 
            WHERE cp.id = customer_order_history.customer_profile_id 
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own order history" ON customer_order_history
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM customer_profiles cp 
            WHERE cp.id = customer_order_history.customer_profile_id 
            AND cp.user_id = auth.uid()
        )
    );
```

### Fase 2.4: Actualización de Aplicación (Semana 7-8)

#### 1. Nuevos Endpoints de API
```typescript
// Customer Profile Management
POST   /api/customers/profile          // Crear/actualizar perfil
GET    /api/customers/profile          // Obtener perfil
DELETE /api/customers/profile          // Eliminar perfil

// Address Management
GET    /api/customers/addresses        // Listar direcciones
POST   /api/customers/addresses        // Agregar dirección
PUT    /api/customers/addresses/:id    // Actualizar dirección
DELETE /api/customers/addresses/:id    // Eliminar dirección

// Payment Methods
GET    /api/customers/payment-methods  // Listar métodos de pago
POST   /api/customers/payment-methods  // Agregar método de pago
DELETE /api/customers/payment-methods/:id // Eliminar método

// Favorites
GET    /api/customers/favorites        // Listar favoritos
POST   /api/customers/favorites        // Agregar favorito
DELETE /api/customers/favorites/:id    // Eliminar favorito

// Order History
GET    /api/customers/orders           // Historial de pedidos
GET    /api/customers/orders/:id       // Detalle de pedido
POST   /api/customers/orders/:id/review // Agregar reseña
```

#### 2. Integración con Supabase Auth
```typescript
// Configuración de Supabase Auth
const supabaseAuth = {
  providers: ['phone', 'email', 'google', 'apple'],
  phone: {
    confirmationUrl: 'https://app.tableflow.com/auth/confirm',
    sms: {
      provider: 'twilio' // Usar PipeCore para SMS
    }
  },
  email: {
    confirmationUrl: 'https://app.tableflow.com/auth/confirm',
    resetPasswordUrl: 'https://app.tableflow.com/auth/reset'
  }
};

// Hook para gestión de perfiles
const useCustomerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('customer_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    };
    
    fetchProfile();
  }, []);
  
  return { profile, loading, setProfile };
};
```

### Fase 2.5: Transición y Cleanup (Semana 9-10)

#### 1. Período de Transición
```sql
-- Mantener ambas tablas durante la transición
-- customers (tabla original) - solo lectura
-- customer_profiles (nueva tabla) - lectura/escritura

-- Crear vista de compatibilidad temporal
CREATE VIEW customers_compat AS
SELECT 
    cp.id,
    cp.phone,
    cp.whatsapp_id,
    cp.full_name as name,
    ca.address as last_delivery_address,
    COALESCE(coh.order_count, 0) as total_orders,
    COALESCE(coh.total_spent, 0) as total_spent,
    cp.created_at,
    cp.updated_at,
    MAX(coh.last_order_at) as last_order_at
FROM customer_profiles cp
LEFT JOIN customer_addresses ca ON cp.id = ca.customer_profile_id AND ca.is_default = true
LEFT JOIN (
    SELECT 
        customer_profile_id,
        COUNT(*) as order_count,
        SUM(order_summary->>'total')::DECIMAL as total_spent,
        MAX((order_summary->>'created_at')::TIMESTAMP) as last_order_at
    FROM customer_order_history
    GROUP BY customer_profile_id
) coh ON cp.id = coh.customer_profile_id
GROUP BY cp.id, cp.phone, cp.whatsapp_id, cp.full_name, ca.address, coh.order_count, coh.total_spent, cp.created_at, cp.updated_at;
```

#### 2. Migración de Referencias
```sql
-- Script para actualizar todas las referencias
UPDATE orders 
SET customer_profile_id = (
    SELECT cp.id 
    FROM customer_profiles cp 
    WHERE cp.phone = (
        SELECT c.phone 
        FROM customers c 
        WHERE c.id = orders.customer_id
    )
    LIMIT 1
)
WHERE customer_profile_id IS NULL;

-- Verificar migración
SELECT 
    COUNT(*) as total_orders,
    COUNT(customer_profile_id) as migrated_orders,
    COUNT(*) - COUNT(customer_profile_id) as pending_orders
FROM orders;
```

#### 3. Cleanup Final
```sql
-- Una vez confirmado que todo funciona correctamente

-- 1. Eliminar vistas de compatibilidad
DROP VIEW IF EXISTS customers_compat;

-- 2. Eliminar columnas obsoletas
ALTER TABLE orders DROP COLUMN customer_id;
ALTER TABLE whatsapp_conversations DROP COLUMN customer_id;
ALTER TABLE customer_loyalty DROP COLUMN customer_id;

-- 3. Eliminar índices obsoletos
DROP INDEX IF EXISTS idx_orders_customer;
DROP INDEX IF EXISTS idx_whatsapp_conversations_customer;
DROP INDEX IF EXISTS idx_customer_loyalty_customer;

-- 4. Eliminar tabla customers (después de backup final)
-- DROP TABLE customers; -- Solo después de confirmar que no se necesita

-- 5. Renombrar customer_profiles a customers para mantener compatibilidad
-- ALTER TABLE customer_profiles RENAME TO customers;
-- ALTER TABLE customer_addresses RENAME COLUMN customer_profile_id TO customer_id;
-- ALTER TABLE customer_payment_methods RENAME COLUMN customer_profile_id TO customer_id;
-- ALTER TABLE customer_favorites RENAME COLUMN customer_profile_id TO customer_id;
-- ALTER TABLE customer_order_history RENAME COLUMN customer_profile_id TO customer_id;
```

## Consideraciones Técnicas

### 1. Compatibilidad con WhatsApp
- Mantener `phone` como identificador principal
- Preservar `whatsapp_id` para integración
- Migrar `last_delivery_address` a `customer_addresses`

### 2. Migración de Datos Sensibles
- **Phone numbers**: Migrar directamente
- **Names**: Migrar si están disponibles
- **Addresses**: Migrar a tabla separada con label "Última dirección"
- **Order history**: Crear resúmenes en `customer_order_history`

### 3. Rollback Plan
```sql
-- En caso de problemas, restaurar desde backup
CREATE TABLE customers_restored AS 
SELECT * FROM customers_backup;

-- Restaurar relaciones
UPDATE orders o 
SET customer_id = cr.id
FROM customers_restored cr
WHERE o.customer_profile_id = (
    SELECT cp.id 
    FROM customer_profiles cp 
    WHERE cp.phone = cr.phone
);
```

### 4. Monitoreo Post-Migración
```sql
-- Scripts de verificación
-- 1. Verificar integridad de datos
SELECT 'customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'customer_profiles', COUNT(*) FROM customer_profiles
UNION ALL
SELECT 'orders_with_old_ref', COUNT(*) FROM orders WHERE customer_id IS NOT NULL
UNION ALL
SELECT 'orders_with_new_ref', COUNT(*) FROM orders WHERE customer_profile_id IS NOT NULL;

-- 2. Verificar migración de pedidos
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN customer_profile_id IS NOT NULL THEN 1 END) as migrated_orders,
    ROUND(COUNT(CASE WHEN customer_profile_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as migration_percentage
FROM orders;
```

## Cronograma Detallado

| Semana | Actividad | Responsable | Entregables |
|--------|-----------|-------------|-------------|
| 1-2 | Preparación | Backend Team | Análisis de datos, backups, nuevas tablas |
| 3-4 | Migración | Backend Team | Scripts de migración, validación de datos |
| 5-6 | Esquema | Backend Team | Nuevas columnas, políticas RLS |
| 7-8 | Aplicación | Frontend/Backend | Nuevos endpoints, integración auth |
| 9-10 | Transición | Full Team | Testing, cleanup, documentación |

## Riesgos y Mitigaciones

### Riesgos Identificados
1. **Pérdida de datos**: Backup completo antes de migración
2. **Downtime**: Migración en horarios de bajo tráfico
3. **Incompatibilidad**: Período de transición con ambas tablas
4. **Performance**: Índices optimizados y monitoreo

### Mitigaciones
1. **Backups múltiples**: Antes, durante y después de migración
2. **Testing exhaustivo**: Ambiente de staging con datos reales
3. **Rollback plan**: Procedimiento documentado para revertir
4. **Monitoreo**: Alertas y dashboards para detectar problemas

## Post-Migración

### Nuevas Funcionalidades Disponibles
1. **Registro múltiple**: Email, Google, Apple
2. **Gestión de perfiles**: Información completa del usuario
3. **Múltiples direcciones**: Casa, trabajo, etc.
4. **Métodos de pago**: Tarjetas, transferencias guardadas
5. **Favoritos**: Productos marcados como favoritos
6. **Historial detallado**: Resúmenes y reseñas de pedidos
7. **Notificaciones**: Configurables por usuario
8. **Recuperación de cuenta**: Reset de contraseña, etc.

### Métricas de Éxito
1. **100% de datos migrados** sin pérdida
2. **0% downtime** durante la transición
3. **Mejora en UX** medida por NPS
4. **Reducción en soporte** por problemas de cuenta
5. **Aumento en retención** de usuarios

---

*Este plan asegura una migración segura y completa del sistema de customers temporal a un sistema de autenticación robusto y escalable.*
