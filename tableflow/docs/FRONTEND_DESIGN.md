# TableFlow - Diseño de Frontend (Sistema de Gestión de Tenants)

## Resumen Ejecutivo

Frontend para la gestión de restaurantes (tenants) en TableFlow. Sistema B2B donde los dueños y administradores de restaurantes pueden gestionar su negocio, menú, pedidos y configuraciones.

## Arquitectura Frontend

### Stack Tecnológico Recomendado
- **Framework:** React + VITE
- **Styling:** Tailwind CSS + shadcn/ui
- **Estado:** Zustand 
- **Autenticación:** Supabase Auth
- **Base de datos:** Supabase (PostgreSQL)
- **Formularios:** React Hook Form + Zod
- **Gráficos:** Recharts o Chart.js

## Estructura de Páginas/Secciones

### 🏠 **1. Dashboard Principal**
**Ruta:** `/dashboard`  
**Tablas conectadas:** `tenants`, `orders`, `products`, `customers`

#### Componentes:
- **Resumen de pedidos:** Gráfico de pedidos por día/semana
- **Ventas del día:** Total de ingresos
- **Pedidos pendientes:** Lista de órdenes en proceso
- **Productos más vendidos:** Top 5 productos
- **Estado del negocio:** Abierto/Cerrado, horarios

#### Datos mostrados:
```typescript
interface DashboardData {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: Order[];
  topProducts: Product[];
  businessStatus: 'open' | 'closed';
  nextOrder: Order | null;
}
```

---

### 📋 **2. Gestión de Pedidos**
**Ruta:** `/orders`  
**Tablas conectadas:** `orders`, `order_items`, `order_item_modifiers`, `customers`, `products`

#### Subsecciones:
- **2.1 Lista de Pedidos** (`/orders`)
  - Filtros: Estado, fecha, sucursal
  - Acciones: Confirmar, preparar, listo, entregar, cancelar
  - Vista: Lista o tarjetas

- **2.2 Detalle de Pedido** (`/orders/[id]`)
  - Información del cliente
  - Items del pedido con modificadores
  - Historial de estados
  - Notas del cliente

- **2.3 Estados de Pedidos**
  - **Pending:** Recién recibidos
  - **Confirmed:** Confirmados por restaurante
  - **Preparing:** En preparación
  - **Ready:** Listos para entrega
  - **Delivered:** Entregados
  - **Cancelled:** Cancelados

#### Componentes:
```typescript
interface OrderManagement {
  orderList: Order[];
  orderDetail: Order | null;
  statusHistory: OrderStatusHistory[];
  updateOrderStatus: (orderId: string, status: string) => void;
  addOrderNote: (orderId: string, note: string) => void;
}
```

---

### 🍕 **3. Gestión de Menú**
**Ruta:** `/menu`  
**Tablas conectadas:** `categories`, `products`, `product_variants`, `product_modifiers`

#### Subsecciones:
- **3.1 Categorías** (`/menu/categories`)
  - Lista de categorías
  - Crear/editar/eliminar categorías
  - Reordenar categorías
  - Activar/desactivar

- **3.2 Productos** (`/menu/products`)
  - Lista de productos por categoría
  - Crear/editar/eliminar productos
  - Subir imágenes
  - Configurar precios y descuentos
  - Control de disponibilidad

- **3.3 Variantes** (`/menu/products/[id]/variants`)
  - Tamaños (Personal, Mediana, Familiar)
  - Precios por variante
  - Disponibilidad por variante

- **3.4 Modificadores** (`/menu/products/[id]/modifiers`)
  - Extras disponibles (Extra Queso, Pepperoni, etc.)
  - Precios de extras
  - Obligatorios/opcionales
  - Máximo de selecciones

#### Componentes:
```typescript
interface MenuManagement {
  categories: Category[];
  products: Product[];
  variants: ProductVariant[];
  modifiers: ProductModifier[];
  
  // Acciones
  createCategory: (data: CreateCategoryDto) => void;
  updateProduct: (id: string, data: UpdateProductDto) => void;
  toggleProductAvailability: (id: string) => void;
  reorderCategories: (categories: Category[]) => void;
}
```

---

### 🏢 **4. Gestión de Sucursales**
**Ruta:** `/branches`  
**Tablas conectadas:** `branches`, `tenants`

#### Subsecciones:
- **4.1 Lista de Sucursales** (`/branches`)
  - Lista de todas las sucursales
  - Estado (activa/inactiva)
  - Sucursal principal

- **4.2 Detalle de Sucursal** (`/branches/[id]`)
  - Información básica
  - Zonas de delivery
  - Horarios de atención
  - Radio de entrega

- **4.3 Configuración de Delivery** (`/branches/[id]/delivery`)
  - Zonas de entrega
  - Precios por zona
  - Tiempos estimados
  - Pedido mínimo

#### Componentes:
```typescript
interface BranchManagement {
  branches: Branch[];
  selectedBranch: Branch | null;
  
  createBranch: (data: CreateBranchDto) => void;
  updateDeliveryZones: (branchId: string, zones: DeliveryZone[]) => void;
  setMainBranch: (branchId: string) => void;
}
```

---

### 👥 **5. Gestión de Usuarios**
**Ruta:** `/users`  
**Tablas conectadas:** `users`, `tenants`

#### Subsecciones:
- **5.1 Lista de Usuarios** (`/users`)
  - Lista de admins y staff
  - Roles y permisos
  - Estado activo/inactivo

- **5.2 Invitar Usuarios** (`/users/invite`)
  - Formulario de invitación
  - Asignar roles
  - Definir permisos

- **5.3 Perfil de Usuario** (`/users/[id]`)
  - Información personal
  - Permisos específicos
  - Historial de actividad

#### Componentes:
```typescript
interface UserManagement {
  users: User[];
  currentUser: User;
  
  inviteUser: (email: string, role: string, permissions: string[]) => void;
  updateUserRole: (userId: string, role: string) => void;
  updatePermissions: (userId: string, permissions: string[]) => void;
}
```

---

### 📊 **6. Analytics y Reportes**
**Ruta:** `/analytics`  
**Tablas conectadas:** `orders`, `order_items`, `products`, `customers`, `daily_sales`, `popular_products`

#### Subsecciones:
- **6.1 Ventas** (`/analytics/sales`)
  - Gráfico de ventas por día/semana/mes
  - Comparación de períodos
  - Ventas por sucursal

- **6.2 Productos** (`/analytics/products`)
  - Productos más vendidos
  - Productos menos vendidos
  - Análisis de rentabilidad

- **6.3 Clientes** (`/analytics/customers`)
  - Clientes más frecuentes
  - Valor promedio por cliente
  - Análisis de retención

- **6.4 Exportar Datos** (`/analytics/export`)
  - Exportar a CSV/Excel
  - Reportes personalizados
  - Programar reportes automáticos

#### Componentes:
```typescript
interface AnalyticsData {
  salesData: DailySales[];
  popularProducts: PopularProduct[];
  customerMetrics: CustomerMetrics;
  
  // Filtros
  dateRange: { start: Date; end: Date };
  branchFilter: string[];
  productFilter: string[];
}
```

---

### ⚙️ **7. Configuración del Negocio**
**Ruta:** `/settings`  
**Tablas conectadas:** `tenants`, `tenant_subscriptions`

#### Subsecciones:
- **7.1 Información General** (`/settings/general`)
  - Datos del restaurante
  - Logo y banner
  - Información de contacto

- **7.2 Horarios** (`/settings/hours`)
  - Horarios por día
  - Días cerrados
  - Horarios especiales

- **7.3 Métodos de Pago** (`/settings/payments`)
  - Métodos aceptados
  - Configuración de pagos
  - Integración con pasarelas

- **7.4 Notificaciones** (`/settings/notifications`)
  - Configuración de WhatsApp
  - Notificaciones por email
  - Alertas de pedidos

- **7.5 Suscripción** (`/settings/subscription`)
  - Plan actual
  - Límites y características
  - Facturación
  - Upgrade/downgrade

#### Componentes:
```typescript
interface SettingsData {
  tenant: Tenant;
  subscription: TenantSubscription;
  
  updateBusinessInfo: (data: UpdateTenantDto) => void;
  updateBusinessHours: (hours: BusinessHours) => void;
  updatePaymentMethods: (methods: string[]) => void;
  updateNotificationSettings: (settings: NotificationSettings) => void;
}
```

---

### 💬 **8. Gestión de WhatsApp**
**Ruta:** `/whatsapp`  
**Tablas conectadas:** `whatsapp_conversations`, `whatsapp_messages`, `customers`

#### Subsecciones:
- **8.1 Conversaciones Activas** (`/whatsapp`)
  - Lista de conversaciones
  - Estado de cada conversación
  - Último mensaje

- **8.2 Historial de Mensajes** (`/whatsapp/[conversationId]`)
  - Mensajes de la conversación
  - Contexto del pedido
  - Respuestas automáticas

- **8.3 Configuración** (`/whatsapp/settings`)
  - Número de WhatsApp
  - Mensajes automáticos
  - Horarios de respuesta

#### Componentes:
```typescript
interface WhatsAppManagement {
  conversations: WhatsAppConversation[];
  messages: WhatsAppMessage[];
  
  sendMessage: (conversationId: string, message: string) => void;
  updateConversationStatus: (id: string, status: string) => void;
  configureAutoMessages: (settings: AutoMessageSettings) => void;
}
```

---

## Navegación Principal

### Sidebar Navigation
```
🏠 Dashboard
📋 Pedidos
   ├── Todos los pedidos
   ├── Pendientes
   ├── En preparación
   └── Listos para entrega

🍕 Menú
   ├── Categorías
   ├── Productos
   └── Inventario

🏢 Sucursales
   ├── Lista de sucursales
   └── Zonas de delivery

👥 Usuarios
   ├── Lista de usuarios
   └── Invitar usuarios

📊 Analytics
   ├── Ventas
   ├── Productos
   ├── Clientes
   └── Exportar

💬 WhatsApp
   ├── Conversaciones
   └── Configuración

⚙️ Configuración
   ├── Información general
   ├── Horarios
   ├── Pagos
   ├── Notificaciones
   └── Suscripción
```

## Permisos por Rol

### Owner (Dueño)
- ✅ Acceso completo a todas las secciones
- ✅ Gestión de usuarios
- ✅ Configuración de suscripción
- ✅ Acceso a analytics completos

### Admin (Administrador)
- ✅ Dashboard y pedidos
- ✅ Gestión de menú
- ✅ Gestión de sucursales
- ✅ Analytics básicos
- ❌ Gestión de usuarios (solo ver)
- ❌ Configuración de suscripción

### Staff (Empleado)
- ✅ Dashboard básico
- ✅ Gestión de pedidos (actualizar estados)
- ✅ Ver menú (sin editar)
- ❌ Analytics
- ❌ Configuración
- ❌ Gestión de usuarios

## Componentes Reutilizables

### 1. **OrderCard**
```typescript
interface OrderCardProps {
  order: Order;
  onStatusUpdate: (status: string) => void;
  showActions: boolean;
}
```

### 2. **ProductForm**
```typescript
interface ProductFormProps {
  product?: Product;
  categories: Category[];
  onSubmit: (data: CreateProductDto) => void;
}
```

### 3. **AnalyticsChart**
```typescript
interface AnalyticsChartProps {
  data: any[];
  type: 'line' | 'bar' | 'pie';
  title: string;
  dateRange: DateRange;
}
```

### 4. **StatusBadge**
```typescript
interface StatusBadgeProps {
  status: string;
  type: 'order' | 'product' | 'user';
}
```

## Estados Globales (Zustand)

### 1. **AuthStore**
```typescript
interface AuthStore {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateUserDto) => Promise<void>;
}
```

### 2. **OrdersStore**
```typescript
interface OrdersStore {
  orders: Order[];
  selectedOrder: Order | null;
  filters: OrderFilters;
  
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  setFilters: (filters: OrderFilters) => void;
}
```

### 3. **MenuStore**
```typescript
interface MenuStore {
  categories: Category[];
  products: Product[];
  selectedCategory: string | null;
  
  fetchCategories: () => Promise<void>;
  fetchProducts: (categoryId?: string) => Promise<void>;
  createProduct: (data: CreateProductDto) => Promise<void>;
  updateProduct: (id: string, data: UpdateProductDto) => Promise<void>;
}
```

## Integración con Supabase

### Hooks Personalizados

```typescript
// useOrders.ts
export const useOrders = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_items(*, product:products(*))
      `)
      .order('created_at', { ascending: false })
  });
  
  return { orders, isLoading };
};

// useProducts.ts
export const useProducts = (categoryId?: string) => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', categoryId],
    queryFn: () => supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*),
        modifiers:product_modifiers(*)
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true)
  });
  
  return { products, isLoading };
};
```

## Responsive Design

### Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### Adaptaciones Mobile
- Sidebar colapsable
- Cards de pedidos en vista vertical
- Formularios en pantalla completa
- Botones de acción grandes
- Navegación por tabs

## Consideraciones de UX

### 1. **Tiempo Real**
- Actualizaciones de pedidos en tiempo real
- Notificaciones de nuevos pedidos
- Sincronización de estados

### 2. **Accesibilidad**
- Navegación por teclado
- Contraste adecuado
- Textos alternativos
- ARIA labels

### 3. **Performance**
- Lazy loading de imágenes
- Paginación de listas
- Optimización de queries
- Caching inteligente

### 4. **Feedback Visual**
- Loading states
- Success/error messages
- Progress indicators
- Confirmaciones de acciones críticas

---

*Este diseño frontend está optimizado para la gestión eficiente de restaurantes, con énfasis en la usabilidad y la experiencia del usuario.*
