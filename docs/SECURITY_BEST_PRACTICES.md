# 🔒 Mejores Prácticas de Seguridad - PipeCore API

## 📖 Descripción

Este documento explica las mejores prácticas de seguridad para manejar credenciales de API en PipeCore, incluyendo cuándo usar encriptación y cuándo no.

## 🎯 **Recomendación Principal: Sin encriptación para APIs**

### ✅ **Por qué NO encriptar claves API:**

1. **Uso directo**: Los servicios externos (Twilio, Resend, SendGrid) esperan claves en texto plano
2. **Performance**: No hay overhead de desencriptación en cada request
3. **Simplicidad**: Menos código que mantener y debuggear
4. **Compatibilidad**: Funciona con cualquier servicio sin modificaciones

### ⚠️ **Seguridad sin encriptación:**

```sql
-- ✅ RECOMENDADO: Claves sin encriptar
CREATE TABLE tenant_providers (
  tenant_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  api_key VARCHAR(500) NOT NULL,        -- ← Sin encriptar
  secret_key VARCHAR(500),              -- ← Sin encriptar
  is_active BOOLEAN DEFAULT true
);
```

**Seguridad garantizada por:**
- ✅ **Seguridad de la base de datos** (PostgreSQL con SSL)
- ✅ **Control de acceso** (solo la aplicación accede a la BD)
- ✅ **Red privada** (BD no expuesta a internet)
- ✅ **Backups encriptados** (backups de la BD encriptados)

## 🔐 **Cuándo SÍ usar encriptación**

### **Caso 1: Información muy sensible**
```sql
-- Solo para secretos críticos del sistema
CREATE TABLE system_secrets (
  id UUID PRIMARY KEY,
  secret_type VARCHAR(50),           -- 'master_key', 'jwt_secret'
  encrypted_value TEXT NOT NULL,     -- ← Encriptado
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Caso 2: Compliance requerido**
```sql
-- Para cumplir con estándares como PCI DSS, HIPAA
CREATE TABLE compliance_data (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(255),
  encrypted_data TEXT NOT NULL,      -- ← Encriptado por compliance
  encryption_key_id VARCHAR(100)
);
```

## 🏗️ **Arquitectura de seguridad recomendada**

### **Nivel 1: Seguridad de red**
```
Internet → Load Balancer → App Server → Database
                ↓              ↓           ↓
            SSL/TLS        Private      SSL + 
                          Network      Auth
```

### **Nivel 2: Seguridad de aplicación**
```typescript
// Variables de entorno para claves del sistema
DATABASE_URL=postgresql://user:password@private-db:5432/pipecore
JWT_SECRET=super_secret_jwt_key_here
ENCRYPTION_KEY=encryption_key_for_sensitive_data

// Credenciales de API sin encriptar en BD
api_key: 're_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
secret_key: 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
```

### **Nivel 3: Seguridad de datos**
```typescript
// Solo encriptar datos PII (información personal)
interface CustomerData {
  email: string;                    // ← Sin encriptar (se usa para envío)
  phone: string;                    // ← Sin encriptar (se usa para envío)
  ssn: string;                      // ← Encriptado (PII sensible)
  creditCard: string;               // ← Encriptado (PCI DSS)
}
```

## 🔧 **Implementación práctica**

### **Configuración de base de datos segura**

```sql
-- 1. Usuario con permisos limitados
CREATE USER pipecore_app WITH PASSWORD 'strong_password_here';

-- 2. Solo permisos necesarios
GRANT SELECT, INSERT, UPDATE ON tenant_providers TO pipecore_app;
GRANT USAGE ON SCHEMA public TO pipecore_app;

-- 3. Sin permisos de administración
-- REVOKE ALL ON DATABASE pipecore FROM pipecore_app;
```

### **Variables de entorno seguras**

```bash
# .env - Configuración de producción
DATABASE_URL=postgresql://pipecore_app:strong_password@db-server:5432/pipecore?sslmode=require
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
NODE_ENV=production

# Claves API globales (fallback)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **Código seguro**

```typescript
// ✅ CORRECTO: Uso directo de claves sin encriptar
class ResendAdapter {
  async sendEmail(apiKey: string, to: string, subject: string) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,  // ← Uso directo
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject })
    });
    return response.json();
  }
}

// ❌ INCORRECTO: Encriptación innecesaria
class ResendAdapter {
  async sendEmail(encryptedApiKey: string, to: string, subject: string) {
    const apiKey = this.decrypt(encryptedApiKey);  // ← Overhead innecesario
    // ... resto del código
  }
}
```

## 📊 **Comparación de enfoques**

| Aspecto | Sin Encriptación | Con Encriptación |
|---------|------------------|------------------|
| **Performance** | ✅ Excelente | ❌ Overhead |
| **Simplicidad** | ✅ Simple | ❌ Complejo |
| **Uso directo** | ✅ Directo | ❌ Requiere desencriptar |
| **Seguridad** | ✅ BD segura | ✅ Doble seguridad |
| **Mantenimiento** | ✅ Fácil | ❌ Más código |
| **Debugging** | ✅ Fácil | ❌ Más complejo |

## 🚨 **Casos donde SÍ usar encriptación**

### **1. Datos de tarjetas de crédito (PCI DSS)**
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(255),
  encrypted_card_number TEXT NOT NULL,    -- ← Encriptado (PCI DSS)
  encrypted_cvv TEXT NOT NULL,            -- ← Encriptado (PCI DSS)
  cardholder_name VARCHAR(255)            -- ← Sin encriptar
);
```

### **2. Información médica (HIPAA)**
```sql
CREATE TABLE medical_records (
  id UUID PRIMARY KEY,
  patient_id VARCHAR(255),
  encrypted_diagnosis TEXT NOT NULL,      -- ← Encriptado (HIPAA)
  doctor_notes TEXT NOT NULL              -- ← Sin encriptar
);
```

### **3. Secretos del sistema**
```sql
CREATE TABLE system_keys (
  id UUID PRIMARY KEY,
  key_name VARCHAR(100),
  encrypted_value TEXT NOT NULL,          -- ← Encriptado
  created_at TIMESTAMP DEFAULT NOW()
);
```

## ✅ **Recomendación final para PipeCore**

### **Para credenciales de API (Twilio, Resend, SendGrid):**
```sql
-- ✅ SIN encriptación - Uso directo
CREATE TABLE tenant_providers (
  tenant_id VARCHAR(255),
  provider VARCHAR(50),
  api_key VARCHAR(500) NOT NULL,          -- ← Sin encriptar
  secret_key VARCHAR(500),                -- ← Sin encriptar
  from_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true
);
```

### **Para datos sensibles del sistema:**
```sql
-- ✅ CON encriptación - Solo para secretos críticos
CREATE TABLE system_secrets (
  id UUID PRIMARY KEY,
  secret_type VARCHAR(50),
  encrypted_value TEXT NOT NULL,          -- ← Encriptado
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 **Conclusión**

**Para PipeCore API, la recomendación es:**

1. ✅ **NO encriptar** credenciales de API (Twilio, Resend, SendGrid)
2. ✅ **SÍ encriptar** solo secretos críticos del sistema
3. ✅ **Confiar en la seguridad** de la base de datos
4. ✅ **Mantener simple** el código de la aplicación
5. ✅ **Optimizar performance** para uso en producción

Esta aproximación balancea **seguridad**, **performance** y **simplicidad** de la manera más efectiva para APIs que necesitan usar credenciales externas frecuentemente.
