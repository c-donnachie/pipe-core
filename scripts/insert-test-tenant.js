#!/usr/bin/env node

/**
 * Script para insertar un tenant de prueba en la base de datos
 * Uso: node scripts/insert-test-tenant.js [tenantId]
 */

require('dotenv').config();
const { Pool } = require('pg');
const crypto = require('crypto');

const TENANT_ID = process.argv[2] || 'test-tenant';
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está configurada');
  console.error('Por favor, configura DATABASE_URL en tu archivo .env');
  process.exit(1);
}

// Detectar si es Render
const isRender = DATABASE_URL.includes('render.com') || process.env.RENDER;
const requiresSSL = isRender;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
});

async function insertTenant() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Insertando tenant de prueba...');
    console.log(`Tenant ID: ${TENANT_ID}`);
    console.log('');

    // Generar API keys aleatorias
    const apiKey = `pk_test_${crypto.randomBytes(8).toString('hex')}`;
    const apiSecret = `sk_test_${crypto.randomBytes(16).toString('hex')}`;

    const defaultSettings = {
      messaging: {
        defaultProvider: 'resend',
        fallbackProvider: 'sendgrid',
        retryAttempts: 3,
        timeout: 30000,
      },
      payments: {
        defaultProvider: 'mercadopago',
        fallbackProvider: 'transbank',
        currency: 'CLP',
        retryAttempts: 3,
      },
      delivery: {
        defaultProvider: 'uber',
        fallbackProvider: 'rappi',
        retryAttempts: 3,
      },
      notifications: {
        webhookUrl: '',
        emailNotifications: true,
        smsNotifications: true,
      },
      limits: {
        maxMessagesPerDay: 10000,
        maxPaymentsPerDay: 1000,
        maxDeliveryRequestsPerDay: 500,
      },
    };

    const services = {
      delivery: true,
      messaging: true,
      payments: true,
    };

    // Insertar o actualizar tenant
    const result = await client.query(
      `INSERT INTO tenants (
        tenant_id,
        name,
        description,
        api_key,
        api_secret,
        status,
        settings,
        services
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (tenant_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        api_key = EXCLUDED.api_key,
        api_secret = EXCLUDED.api_secret,
        status = EXCLUDED.status,
        settings = EXCLUDED.settings,
        services = EXCLUDED.services,
        updated_at = NOW()
      RETURNING *`,
      [
        TENANT_ID,
        `Tenant ${TENANT_ID}`,
        'Tenant creado para pruebas y desarrollo',
        apiKey,
        apiSecret,
        'active',
        JSON.stringify(defaultSettings),
        JSON.stringify(services),
      ]
    );

    const tenant = result.rows[0];

    console.log('✅ Tenant insertado exitosamente!');
    console.log('');
    console.log('📋 Información del tenant:');
    console.log(`  Tenant ID: ${tenant.tenant_id}`);
    console.log(`  Name: ${tenant.name}`);
    console.log(`  API Key: ${tenant.api_key}`);
    console.log(`  API Secret: ${tenant.api_secret}`);
    console.log(`  Status: ${tenant.status}`);
    console.log(`  Services: ${JSON.stringify(tenant.services)}`);
    console.log(`  Created: ${tenant.created_at}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error insertando tenant:', error.message);
    console.error('');
    console.error('Verifica que:');
    console.error('  1. La tabla tenants existe');
    console.error('  2. DATABASE_URL es correcta');
    console.error('  3. Tienes permisos para insertar');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

insertTenant();

