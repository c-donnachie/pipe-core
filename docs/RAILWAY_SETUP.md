# 🚂 Configuración de Railway para PipeCore

## Variables de Entorno Requeridas

Cuando creas una base de datos PostgreSQL en Railway, necesitas configurar las siguientes variables de entorno en tu proyecto de Railway:

### 📦 Variables de Base de Datos

Railway proporciona automáticamente la variable `DATABASE_URL` cuando creas un servicio PostgreSQL. Esta variable contiene toda la información de conexión:

```
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

**✅ Esta variable se configura automáticamente por Railway - NO necesitas hacer nada**

### 🔐 Variables de Autenticación

Necesitas configurar manualmente estas variables en Railway:

#### 1. `SERVICE_ROLE_SECRET`
**Descripción:** Secreto usado para proteger el endpoint interno `/pipecore/internal/register-tenant`. Solo Supabase debe conocer este secreto.

**Cómo obtenerlo:**
- Genera un secreto seguro (mínimo 32 caracteres)
- Puedes usar: `openssl rand -base64 32`
- O generar uno en: https://randomkeygen.com/

**Ejemplo:**
```
SERVICE_ROLE_SECRET=sk_live_9sd8f76f87df_railway_secret_xyz123
```

**⚠️ IMPORTANTE:** Este mismo secreto debe configurarse en Supabase como variable de entorno para que pueda llamar al endpoint interno.

#### 2. `JWT_SECRET` (Opcional)
**Descripción:** Secreto global para JWT (actualmente no se usa, pero es buena práctica tenerlo).

**Ejemplo:**
```
JWT_SECRET=your_jwt_secret_key_minimum_32_chars
```

### 📋 Resumen de Variables

| Variable | Fuente | Requerida | Descripción |
|----------|--------|-----------|-------------|
| `DATABASE_URL` | Railway (automático) | ✅ Sí | URL de conexión a PostgreSQL |
| `SERVICE_ROLE_SECRET` | Manual | ✅ Sí | Secreto para endpoint interno |
| `JWT_SECRET` | Manual | ⚠️ Opcional | Secreto global para JWT |

## 🔧 Cómo Configurar en Railway

1. Ve a tu proyecto en Railway
2. Selecciona tu servicio de aplicación (no la base de datos)
3. Ve a la pestaña **Variables**
4. Haz clic en **+ New Variable**
5. Agrega cada variable:
   - **Name:** `SERVICE_ROLE_SECRET`
   - **Value:** Tu secreto generado
6. Repite para `JWT_SECRET` si lo necesitas

## 🗄️ Crear las Tablas en PostgreSQL

Después de configurar las variables, necesitas ejecutar el schema SQL para crear las tablas:

1. Ve a tu servicio PostgreSQL en Railway
2. Haz clic en **Query** o usa un cliente PostgreSQL
3. Ejecuta el contenido del archivo `db/pipecore/schema.sql`

O desde la terminal:

```bash
# Conectarte a Railway PostgreSQL
psql $DATABASE_URL

# Ejecutar el schema
\i db/pipecore/schema.sql
```

## ✅ Verificar Configuración

Una vez configurado, puedes verificar que todo funciona:

1. **Verificar conexión a BD:**
   ```bash
   curl https://tu-app.railway.app/api/docs
   ```
   Deberías ver la documentación de Swagger sin errores.

2. **Verificar endpoint interno:**
   ```bash
   curl -X POST https://tu-app.railway.app/pipecore/internal/register-tenant \
     -H "Authorization: Bearer $SERVICE_ROLE_SECRET" \
     -H "Content-Type: application/json" \
     -d '{
       "tenantId": "test",
       "apiKey": "pk_test_123",
       "apiSecret": "sk_test_456",
       "services": {"delivery": true}
     }'
   ```

## 🔗 Configurar en Supabase

En Supabase, también necesitas configurar:

1. **Variable de entorno:** `PIPECORE_SERVICE_ROLE_SECRET` con el mismo valor que `SERVICE_ROLE_SECRET` en Railway
2. **Variable de entorno:** `PIPECORE_INTERNAL_URL` con la URL de tu app en Railway:
   ```
   PIPECORE_INTERNAL_URL=https://tu-app.railway.app
   ```

## 📝 Notas Importantes

- **Seguridad:** Nunca expongas `SERVICE_ROLE_SECRET` en el frontend o en logs
- **Base de datos:** Railway crea automáticamente la variable `DATABASE_URL` cuando agregas un servicio PostgreSQL
- **SSL:** Railway usa SSL por defecto, el código ya está configurado para esto
- **Backups:** Railway hace backups automáticos de PostgreSQL, pero considera hacer backups manuales también

