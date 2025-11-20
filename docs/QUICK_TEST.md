# 🚀 Prueba Rápida del Módulo de Autenticación

## ⚠️ Error Común: 401 Unauthorized

Si recibes `401 Unauthorized` con el mensaje "Token de servicio inválido", verifica:

### 1. Formato del Header Authorization

**❌ INCORRECTO:**
```
Authorization: Bearertest
```

**✅ CORRECTO:**
```
Authorization: Bearer <SERVICE_ROLE_SECRET>
```

**Ejemplo correcto:**
```
Authorization: Bearer sk_live_9sd8f76f87df_railway_secret_xyz123
```

### 2. Verificar SERVICE_ROLE_SECRET

```bash
# Verificar si está configurado
echo $SERVICE_ROLE_SECRET

# Si no está configurado, configúralo:
export SERVICE_ROLE_SECRET="tu_secreto_aqui"
```

### 3. Prueba Completa con cURL

```bash
# Configurar el secreto (si no está en .env)
export SERVICE_ROLE_SECRET="tu_secreto_aqui"

# Registrar tenant
curl -X POST http://localhost:3000/pipecore/internal/register-tenant \
  -H "Authorization: Bearer $SERVICE_ROLE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "roe",
    "apiKey": "pk_live_a8sd7f6",
    "apiSecret": "sk_live_9sd8f76f87df",
    "services": {
      "delivery": true,
      "messaging": true
    }
  }'
```

### 4. En Postman/Insomnia

**Headers:**
- `Authorization`: `Bearer tu_secreto_aqui` (con espacio entre Bearer y el token)
- `Content-Type`: `application/json`

**Body (raw JSON):**
```json
{
  "tenantId": "roe",
  "apiKey": "pk_live_a8sd7f6",
  "apiSecret": "sk_live_9sd8f76f87df",
  "services": {
    "delivery": true,
    "messaging": true
  }
}
```

### 5. Generar un Secreto Seguro

Si necesitas generar un nuevo secreto:

```bash
# Opción 1: OpenSSL
openssl rand -base64 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opción 3: Online
# https://randomkeygen.com/
```

### 6. Verificar en el Código

El guard espera exactamente esto:
```typescript
// En InternalApiGuard
const token = authHeader.replace('Bearer ', ''); // Remueve "Bearer "
if (token !== serviceRoleSecret) { // Compara con SERVICE_ROLE_SECRET
  throw new UnauthorizedException('Token de servicio inválido');
}
```

## ✅ Checklist de Prueba

- [ ] `SERVICE_ROLE_SECRET` está configurado en variables de entorno
- [ ] Header `Authorization` tiene formato: `Bearer <token>` (con espacio)
- [ ] El token coincide exactamente con `SERVICE_ROLE_SECRET`
- [ ] Servidor está corriendo en `localhost:3000`
- [ ] Base de datos está conectada (probar con `/test`)

## 🔍 Debugging

Si sigue fallando, verifica los logs del servidor:

```bash
# Los logs mostrarán:
# "Intento de acceso con token inválido" si el token no coincide
# "SERVICE_ROLE_SECRET no configurado" si falta la variable
```

