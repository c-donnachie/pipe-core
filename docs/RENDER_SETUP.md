# 🚀 Configuración de Render para PipeCore

## Variables de Entorno Requeridas

Cuando despliegas en Render, necesitas configurar las siguientes variables de entorno:

### 📦 Variables de Base de Datos

Render proporciona automáticamente la variable `DATABASE_URL` cuando creas un servicio PostgreSQL. Esta variable contiene toda la información de conexión:

```
DATABASE_URL=postgresql://user:password@dpg-xxxxx-a.render.com:5432/dbname
```

**✅ Esta variable se configura automáticamente por Render - NO necesitas hacer nada**

**Nota:** El código detecta automáticamente si estás usando Render y configura SSL apropiadamente.

### 🔐 Variables de Autenticación

Necesitas configurar manualmente estas variables en Render:

#### 1. `SERVICE_ROLE_SECRET`
**Descripción:** Secreto usado para proteger el endpoint interno `/pipecore/internal/register-tenant`. Solo Supabase debe conocer este secreto.

**Cómo obtenerlo:**
- Genera un secreto seguro (mínimo 32 caracteres)
- Puedes usar: `openssl rand -base64 32`
- O generar uno en: https://randomkeygen.com/

**Ejemplo:**
```
SERVICE_ROLE_SECRET=sk_live_9sd8f76f87df_render_secret_xyz123
```

**⚠️ IMPORTANTE:** Este mismo secreto debe configurarse en Supabase como variable de entorno para que pueda llamar al endpoint interno.

#### 2. `JWT_SECRET` (Opcional)
**Descripción:** Secreto global para JWT (actualmente no se usa, pero es buena práctica tenerlo).

**Ejemplo:**
```
JWT_SECRET=your_jwt_secret_key_minimum_32_chars
```

#### 3. `NODE_ENV`
**Descripción:** Entorno de ejecución. Render lo configura automáticamente, pero puedes sobrescribirlo.

**Valores:**
- `production` (por defecto en Render)
- `development` (solo para desarrollo local)

### 📋 Resumen de Variables

| Variable | Fuente | Requerida | Descripción |
|----------|--------|-----------|-------------|
| `DATABASE_URL` | Render (automático) | ✅ Sí | URL de conexión a PostgreSQL |
| `SERVICE_ROLE_SECRET` | Manual | ✅ Sí | Secreto para endpoint interno |
| `JWT_SECRET` | Manual | ⚠️ Opcional | Secreto global para JWT |
| `NODE_ENV` | Render (automático) | ⚠️ Opcional | Entorno de ejecución |
| `PORT` | Render (automático) | ⚠️ Opcional | Puerto del servidor (por defecto 10000) |

## 🔧 Cómo Configurar en Render

### 1. Configurar Variables de Entorno

1. Ve a tu servicio en Render Dashboard
2. Ve a la pestaña **Environment**
3. Haz clic en **Add Environment Variable**
4. Agrega cada variable:
   - **Key:** `SERVICE_ROLE_SECRET`
   - **Value:** Tu secreto generado
5. Repite para `JWT_SECRET` si lo necesitas

### 2. Configurar Build y Start Commands

En la configuración del servicio, asegúrate de tener:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run start
```

**Nota:** El código ya está configurado para usar `node dist/main` en producción.

## 🗄️ Crear las Tablas en PostgreSQL

Después de configurar las variables, necesitas ejecutar el schema SQL para crear las tablas:

### Opción 1: Desde Render Dashboard

1. Ve a tu servicio PostgreSQL en Render
2. Haz clic en **Connect** → **External Connection**
3. Copia la cadena de conexión
4. Conéctate usando un cliente PostgreSQL (pgAdmin, DBeaver, etc.)
5. Ejecuta el contenido del archivo `db/pipecore/schema.sql`

### Opción 2: Desde la Terminal

```bash
# Conectarte a Render PostgreSQL
psql $DATABASE_URL

# Ejecutar el schema
\i db/pipecore/schema.sql
```

O usando el archivo directamente:

```bash
psql $DATABASE_URL -f db/pipecore/schema.sql
```

### Opción 3: Recrear Tabla Tenants

Si necesitas recrear solo la tabla `tenants`:

```bash
psql $DATABASE_URL -f db/pipecore/recreate-tenants.sql
```

## ✅ Verificar Configuración

Una vez configurado, puedes verificar que todo funciona:

1. **Verificar conexión a BD:**
   ```bash
   curl https://tu-app.onrender.com/test
   ```
   Deberías ver una respuesta JSON con `"success": true` y la versión de PostgreSQL.

2. **Verificar endpoint interno:**
   ```bash
   curl -X POST https://tu-app.onrender.com/pipecore/internal/register-tenant \
     -H "Authorization: Bearer $SERVICE_ROLE_SECRET" \
     -H "Content-Type: application/json" \
     -d '{
       "tenantId": "test",
       "apiKey": "pk_test_123",
       "apiSecret": "sk_test_456",
       "services": {"delivery": true, "messaging": true, "payments": true}
     }'
   ```

3. **Verificar documentación Swagger:**
   ```bash
   curl https://tu-app.onrender.com/api/docs
   ```
   Deberías ver la documentación de Swagger sin errores.

## 🔗 Configurar en Supabase

En Supabase, también necesitas configurar:

1. **Variable de entorno:** `PIPECORE_SERVICE_ROLE_SECRET` con el mismo valor que `SERVICE_ROLE_SECRET` en Render
2. **Variable de entorno:** `PIPECORE_INTERNAL_URL` con la URL de tu app en Render:
   ```
   PIPECORE_INTERNAL_URL=https://tu-app.onrender.com
   ```

## 🔒 Configuración de SSL

El código detecta automáticamente si estás usando Render y configura SSL apropiadamente:

- **Render PostgreSQL:** Requiere SSL siempre (configurado automáticamente)
- **Local:** SSL deshabilitado por defecto

## 📝 Notas Importantes

- **Seguridad:** Nunca expongas `SERVICE_ROLE_SECRET` en el frontend o en logs
- **Base de datos:** Render crea automáticamente la variable `DATABASE_URL` cuando agregas un servicio PostgreSQL
- **SSL:** Render usa SSL por defecto, el código ya está configurado para esto
- **Timeouts:** Los timeouts están configurados para Render (10 segundos para conexión inicial)
- **Backups:** Render hace backups automáticos de PostgreSQL, pero considera hacer backups manuales también
- **Spinning down:** Las instancias gratuitas de Render se "duermen" después de inactividad, lo que puede causar delays de ~50 segundos en el primer request

## 🐛 Troubleshooting

### Error de conexión SSL

Si ves errores de SSL, verifica que:
- `NODE_ENV` esté configurado como `production`
- `DATABASE_URL` contenga `render.com` en la URL
- El código detectará automáticamente Render y habilitará SSL

### Timeout de conexión

Si ves timeouts:
- Verifica que la base de datos esté activa (no dormida)
- El timeout de conexión está configurado en 10 segundos para Render
- Considera usar una instancia paga si necesitas mejor rendimiento

### Variables de entorno no encontradas

Si las variables no se encuentran:
- Verifica que estén configuradas en Render Dashboard → Environment
- Asegúrate de hacer un nuevo deploy después de agregar variables
- Las variables se cargan al iniciar el servicio

