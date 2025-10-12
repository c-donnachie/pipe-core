# Endpoint Create Delivery Quote

## Descripción
Se ha implementado exitosamente el endpoint `POST /uber/customers/:customer_id/delivery_quotes` que replica exactamente la funcionalidad de "Create Quote" de la API de Uber Direct mostrada en la imagen de Postman.

## Endpoint
```
POST /uber/customers/:customer_id/delivery_quotes
```

## Parámetros de URL
- `customer_id` (string): ID del cliente de Uber Direct

## Headers
- `Content-Type: application/json`
- `Authorization: Bearer {token}` (manejado automáticamente)
- `x-uber-token` (opcional): Token personalizado para autenticación

## Request Body
```json
{
  "dropoff_address": "123 Main St, San Francisco, CA 94102",
  "pickup_address": "456 Market St, San Francisco, CA 94103",
  "pickup_latitude": 37.7749,
  "pickup_longitude": -122.4194,
  "dropoff_latitude": 37.7849,
  "dropoff_longitude": -122.4094,
  "pickup_ready_dt": "2024-01-15T10:30:00Z",
  "pickup_deadline_dt": "2024-01-15T11:00:00Z",
  "dropoff_ready_dt": "2024-01-15T11:30:00Z",
  "dropoff_deadline_dt": "2024-01-15T12:00:00Z",
  "pickup_phone_number": "+14155551234",
  "dropoff_phone_number": "+14155555678",
  "manifest_total_value": 2500,
  "external_store_id": "store_12345"
}
```

## Response
```json
{
  "quote_id": "quote_abc123xyz",
  "fee": 850,
  "currency": "USD",
  "currency_type": "USD",
  "pickup_eta": "2024-01-15T10:30:00Z",
  "dropoff_eta": "2024-01-15T11:00:00Z",
  "deliverable": true,
  "reason": "Delivery available",
  "expires_at": "2024-01-15T12:00:00Z"
}
```

## Ejemplo con cURL
```bash
curl -X POST http://localhost:3000/uber/customers/your_customer_id/delivery_quotes \
  -H "Content-Type: application/json" \
  -d '{
    "dropoff_address": "123 Main St, San Francisco, CA 94102",
    "pickup_address": "456 Market St, San Francisco, CA 94103",
    "pickup_latitude": 37.7749,
    "pickup_longitude": -122.4194,
    "dropoff_latitude": 37.7849,
    "dropoff_longitude": -122.4094,
    "pickup_ready_dt": "2024-01-15T10:30:00Z",
    "pickup_deadline_dt": "2024-01-15T11:00:00Z",
    "dropoff_ready_dt": "2024-01-15T11:30:00Z",
    "dropoff_deadline_dt": "2024-01-15T12:00:00Z",
    "pickup_phone_number": "+14155551234",
    "dropoff_phone_number": "+14155555678",
    "manifest_total_value": 2500,
    "external_store_id": "store_12345"
  }'
```

## Características Implementadas

### ✅ **Arquitectura Mejorada**
- **DTO**: `CreateQuoteDto` con validaciones completas
- **Interface**: `DeliveryQuoteRequest` y `DeliveryQuoteResponse`
- **Constantes**: URL del endpoint centralizada
- **Servicio**: Método `createQuote()` en `UberService`

### ✅ **Validaciones**
- Todos los campos requeridos validados
- Tipos de datos correctos (string, number)
- Coordenadas de latitud y longitud
- Números de teléfono
- Fechas en formato ISO

### ✅ **Autenticación**
- Bearer Token automático via OAuth
- Soporte para token personalizado via header
- Manejo de errores de autenticación

### ✅ **Documentación Swagger**
- Documentación completa del endpoint
- Ejemplos de request y response
- Códigos de estado HTTP documentados
- Descripción detallada de parámetros

### ✅ **Logging y Monitoreo**
- Logs detallados de requests y responses
- Debug de datos enviados
- Manejo de errores con contexto

## Integración con la Arquitectura Existente

El endpoint se integra perfectamente con:
- ✅ Sistema de autenticación OAuth existente
- ✅ Constantes centralizadas
- ✅ Interfaces tipadas
- ✅ Servicios organizados por responsabilidad
- ✅ DTOs con validaciones
- ✅ Documentación Swagger

## Variables de Entorno Requeridas
```bash
UBER_DIRECT_CLIENT_ID=tu_client_id_aqui
UBER_DIRECT_CLIENT_SECRET=tu_client_secret_aqui
UBER_BASE_URL=https://api.uber.com/v1
```

El endpoint está listo para usar y replicará exactamente el comportamiento de la API de Uber Direct mostrada en Postman.
