# 🏗️ Arquitectura de Separación de Bases de Datos - PipeCore

## 📖 Descripción

Este documento explica la arquitectura recomendada de separar las bases de datos entre PipeCore API (PostgREST) y los backends SaaS (datos de negocio), siguiendo las mejores prácticas de microservicios.

## 🎯 **Arquitectura Recomendada: Separación Total**

### ✅ **SÍ, es la mejor práctica separar las bases de datos:**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SaaS Backend  │    │  PipeCore API   │    │ Servicios       │
│   (Supabase)    │    │  (Supabase)     │    │ Externos        │
│                 │    │                 │    │                 │
│ • Pedidos       │    │ • Configs       │    │ • Twilio        │
│ • Menús         │    │ • Logs          │    │ • Resend        │
│ • Usuarios      │    │ • Webhooks      │    │ • MercadoPago   │
│ • Suscripciones │    │ • Credenciales  │    │ • Uber Direct   │
│ • Clientes      │    │ • Estadísticas  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 **Ventajas de la separación**

### ✅ **1. Separación de responsabilidades**
```typescript
// SaaS Backend (TableFlow, Genda, ROE)
- Datos de negocio (pedidos, menús, usuarios)
- Lógica de aplicación específica
- Autenticación de usuarios finales
- APIs públicas del producto

// PipeCore API
- Configuraciones de integraciones
- Logs de mensajes y transacciones
- Credenciales de proveedores
- Orquestación de servicios externos
```

### ✅ **2. Escalabilidad independiente**
```yaml
# SaaS Backend
- Escala según usuarios del producto
- Optimizado para consultas de negocio
- Backup/restore independiente

# PipeCore API  
- Escala según volumen de integraciones
- Optimizado para logs y configuraciones
- Backup/restore independiente
```

### ✅ **3. Seguridad mejorada**
```typescript
// SaaS Backend
- Acceso a datos de usuarios
- Autenticación de clientes
- APIs públicas

// PipeCore API
- Credenciales de proveedores
- Logs sensibles
- APIs internas (no públicas)
```

### ✅ **4. Mantenimiento independiente**
```bash
# Puedes actualizar PipeCore sin afectar SaaS
# Puedes actualizar SaaS sin afectar PipeCore
# Deployments independientes
# Rollbacks independientes
```

## 🏗️ **Implementación práctica**

### **Proyecto 1: SaaS Backend (Supabase)**
```sql
-- Supabase para cada SaaS (TableFlow, Genda, ROE)
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID,
  restaurant_id UUID,
  items JSONB,
  total DECIMAL,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY,
  restaurant_id UUID,
  name VARCHAR(255),
  price DECIMAL,
  description TEXT,
  available BOOLEAN DEFAULT true
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  plan_name VARCHAR(100),
  status VARCHAR(50),
  expires_at TIMESTAMP
);
```

### **Proyecto 2: PipeCore API (Supabase)**
```sql
-- Supabase separado para PipeCore
CREATE TABLE tenant_providers (
  tenant_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  api_key VARCHAR(500) NOT NULL,
  secret_key VARCHAR(500),
  from_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE message_logs (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  to_address VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE integration_logs (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  service VARCHAR(50) NOT NULL, -- 'payment', 'delivery', 'messaging'
  action VARCHAR(100) NOT NULL,
  payload JSONB,
  response JSONB,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 **Flujo de comunicación**

### **1. SaaS → PipeCore (Integraciones)**
```typescript
// TableFlow (SaaS Backend) solicita envío de mensaje
const response = await fetch('https://pipecore-api.com/messaging/send/email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${PIPECORE_API_KEY}` // ← API key de PipeCore
  },
  body: JSON.stringify({
    tenant_id: 'tableflow_123',           // ← Identificador del tenant
    to: 'cliente@email.com',
    subject: 'Confirmación de pedido',
    htmlContent: '<h1>¡Pedido confirmado!</h1>'
  })
});
```

### **2. PipeCore → SaaS (Webhooks)**
```typescript
// PipeCore notifica a TableFlow sobre evento
await fetch('https://tableflow-supabase.com/functions/v1/webhooks/payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TABLEFLOW_SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    event: 'payment.confirmed',
    tenant_id: 'tableflow_123',
    payment_id: 'pay_123456789',
    amount: 15990,
    status: 'confirmed'
  })
});
```

## 💰 **Costos optimizados**

### **SaaS Backend (Supabase)**
```yaml
# TableFlow
- Plan: Pro ($25/mes)
- Uso: Datos de pedidos, menús, usuarios
- Escala: Según restaurantes activos

# Genda  
- Plan: Pro ($25/mes)
- Uso: Datos de citas, profesionales, clientes
- Escala: Según citas programadas

# ROE
- Plan: Pro ($25/mes) 
- Uso: Datos de productos, órdenes, inventario
- Escala: Según transacciones de e-commerce
```

### **PipeCore API (Supabase)**
```yaml
# PipeCore
- Plan: Pro ($25/mes)
- Uso: Logs, configuraciones, credenciales
- Escala: Según volumen de integraciones
- Compartido: Entre todos los SaaS
```

### **Total optimizado:**
```
3 SaaS × $25/mes + 1 PipeCore × $25/mes = $100/mes
vs
1 Monolito × $599/mes = $599/mes

Ahorro: $499/mes (83% menos) ✅
```

## 🔧 **Configuración de variables de entorno**

### **SaaS Backend (.env)**
```bash
# TableFlow Backend
SUPABASE_URL=https://tableflow-project.supabase.co
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# PipeCore API (para integraciones)
PIPECORE_API_URL=https://pipecore-api.com
PIPECORE_API_KEY=pc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **PipeCore API (.env)**
```bash
# PipeCore Database
SUPABASE_URL=https://pipecore-project.supabase.co
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Credenciales de proveedores
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🚀 **Ventajas específicas para PipeCore**

### ✅ **1. Aislamiento de datos**
```typescript
// SaaS Backend - Solo datos de negocio
const orders = await supabase
  .from('orders')
  .select('*')
  .eq('restaurant_id', restaurantId);

// PipeCore - Solo datos de integración
const messageLogs = await supabase
  .from('message_logs')
  .select('*')
  .eq('tenant_id', tenantId);
```

### ✅ **2. Seguridad por capas**
```typescript
// SaaS Backend - RLS para usuarios
CREATE POLICY "Users can only see their own orders" ON orders
  FOR ALL USING (user_id = auth.uid());

// PipeCore - RLS para tenants
CREATE POLICY "Tenants can only see their own logs" ON message_logs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id'));
```

### ✅ **3. APIs especializadas**
```typescript
// SaaS Backend - APIs de negocio
GET /api/orders
GET /api/menu
GET /api/customers

// PipeCore - APIs de integración
POST /messaging/send/email
POST /payments/create
POST /delivery/quote
```

## 🎯 **Recomendación final**

### ✅ **SÍ, usa Supabase separado para PipeCore porque:**

1. **Separación clara** - PipeCore solo maneja integraciones
2. **Escalabilidad** - Cada SaaS escala independientemente
3. **Seguridad** - Credenciales aisladas de datos de negocio
4. **Mantenimiento** - Updates independientes sin afectar SaaS
5. **Costos** - $100/mes vs $599/mes (83% menos)
6. **Flexibilidad** - Cada SaaS puede tener su propia BD

### 🏗️ **Arquitectura final:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  TableFlow      │    │  PipeCore API   │    │  Genda          │
│  (Supabase)     │    │  (Supabase)     │    │  (Supabase)     │
│  $25/mes        │    │  $25/mes        │    │  $25/mes        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  ROE            │
                    │  (Supabase)     │
                    │  $25/mes        │
                    └─────────────────┘

Total: $100/mes (vs $599/mes monolito)
```

**Esta arquitectura es la mejor práctica para microservicios y te dará máxima flexibilidad, seguridad y escalabilidad.** 🎉
