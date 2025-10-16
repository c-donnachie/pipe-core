# 🧠 PipeCore API — Core Overview

## 📖 Descripción general

**PipeCore API** es el núcleo lógico y de integración del ecosistema SaaS.  
Su responsabilidad es **orquestar servicios externos, manejar flujos automatizados y mantener la coherencia multi-tenant**, actuando como una **capa intermedia entre los backends verticales (como Supabase) y los proveedores externos**.

El objetivo del PipeCore es abstraer toda la complejidad de integraciones, pagos, mensajería y delivery, para que los productos (TableFlow, Genda, ROE, etc.) se concentren en su propia lógica de negocio sin duplicar integraciones.

---

## 🧩 Responsabilidades principales

### 1. Integraciones externas

El PipeCore gestiona todas las integraciones críticas del sistema.

| Categoría | Proveedores | Función |
|------------|-------------|----------|
| **Pagos** | MercadoPago, Transbank, Stripe | Crear, validar y recibir webhooks de pagos y suscripciones. |
| **Delivery / Logística** | Uber Direct, Rappi, PedidosYa | Cotizar, crear y monitorear envíos. |
| **Mensajería** | Twilio / WhatsApp Cloud API, Email (SendGrid / Resend) | Enviar notificaciones y mensajes automáticos. |
| **Notificaciones internas** | Webhooks HTTP hacia los backends verticales | Actualizar estados de pedidos, pagos y entregas. |

---

### 2. Multi-tenant y credenciales

Cada cliente SaaS (tenant) tiene sus propias configuraciones y credenciales.  
El PipeCore se encarga de aislarlas, encriptarlas y gestionarlas.

```sql
CREATE TABLE provider_credentials (
  tenant_id uuid,
  provider text,
  api_key text encrypted,
  secret_key text encrypted,
  active boolean,
  created_at timestamp
);

3. Logs, auditoría y trazabilidad

PipeCore guarda registros operacionales de cada interacción externa.


CREATE TABLE payment_logs (
  tenant_id uuid,
  provider text,
  action text, -- "create_payment", "webhook_confirmed"
  payload jsonb,
  response jsonb,
  status text,
  created_at timestamp
);


Usos:

Auditoría y debugging.

Reintentos automáticos (jobs).

Trazabilidad completa de cada flujo.

4. Eventos y webhooks

PipeCore actúa como Event Bridge:

Escucha webhooks externos (pagos, delivery, WhatsApp).

Los traduce a eventos internos (payment.confirmed, delivery.completed, etc.).

Envía esos eventos al backend correspondiente del tenant (por ejemplo, una Edge Function de Supabase).

Ejemplo:
MP → PipeCore (/webhooks/payment)
      → POST /functions/v1/webhooks/payment (Supabase)


5. Mensajería automatizada

El módulo messaging/ maneja bots y notificaciones.
Sus funciones incluyen:

Procesar mensajes entrantes (Twilio / Meta Webhook).

Enviar respuestas automáticas (confirmaciones, seguimientos, promociones).

Usar plantillas configurables por tenant.

Ejemplo JSON:
{
  "tenant_id": "tableflow_123",
  "message": "Tu pedido fue confirmado ✅",
  "channel": "whatsapp",
  "to": "+56988888888"
}


6. Colas y tareas asíncronas

Para evitar bloqueos, PipeCore utiliza colas (event_queue) y workers para:

Reintentar webhooks fallidos.

Confirmar entregas.

Renovar suscripciones.

Sincronizar estados entre servicios.


7. Seguridad

Tokens firmados por tenant.

Encriptación de credenciales (AES / Vault).

Validación de firmas de webhooks (HMAC).

Ningún servicio externo expone sus claves directamente a los frontends.

🏗️ Estructura modular

src/
 ├─ tenants/               → Configuración multi-tenant
 ├─ payments/              → Integración con pasarelas
 ├─ deliveries/            → Integraciones logísticas
 ├─ messaging/             → WhatsApp / Email
 ├─ webhooks/              → Entrada y salida de eventos
 ├─ jobs/                  → Workers y colas
 ├─ logs/                  → Auditoría y métricas
 └─ utils/                 → Cifrado, firma, validaciones


⚙️ Flujo general
sequenceDiagram
    participant B as Backend (Supabase)
    participant P as PipeCore API
    participant X as Servicios Externos

    B->>P: Crea pedido / solicita pago / cotiza envío
    P->>X: Llama integración externa
    X-->>P: Respuesta o webhook
    P->>B: Webhook interno → actualiza base de datos


🚫 Qué no hace PipeCore

No guarda datos de negocio (pedidos, menús, clientes).

No maneja autenticación de usuarios finales.

No renderiza vistas ni frontends.

No reemplaza Supabase ni actúa como ORM.

✅ Qué sí hace

Centraliza toda la lógica de integraciones.

Gestiona webhooks externos y notificaciones internas.

Ofrece seguridad, aislamiento y trazabilidad.

Permite escalar y reutilizar el mismo core en múltiples verticales (TableFlow, Genda, ROE).


🔁 Relación con los demás sistemas
Capa	Rol
Frontends	Solicitan acciones (pagos, pedidos, notificaciones).
Backend (Supabase)	Guarda la data estructurada de negocio.
PipeCore API	Orquesta integraciones y procesos complejos.
Servicios externos	Ejecutan acciones físicas o financieras.