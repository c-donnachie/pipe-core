import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';


@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL no está configurada. La base de datos no estará disponible.');
      return;
    }

    // Detectar si es Render (requiere SSL siempre)
    const isRender = databaseUrl.includes('render.com') || process.env.RENDER;
    
    // Render requiere SSL siempre (no solo en producción)
    const requiresSSL = isRender;

    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: requiresSSL ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Aumentado para Render (puede ser más lento)
      // Configuraciones adicionales para Render
      ...(isRender && {
        statement_timeout: 30000, // 30 segundos timeout para queries
        query_timeout: 30000,
      }),
    });

    this.pool.on('error', (err) => {
      this.logger.error('Error inesperado en el pool de conexiones PostgreSQL', err);
    });

    this.logger.log(`Conexión PostgreSQL configurada (${isRender ? 'Render' : 'Local'}, SSL: ${requiresSSL})`);
  }

  async onModuleInit() {
    if (this.pool) {
      try {
        await this.pool.query('SELECT NOW()');
        this.logger.log('Conexión a PostgreSQL establecida exitosamente');
      } catch (error) {
        this.logger.error('Error al conectar con PostgreSQL', error);
      }
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('Conexión a PostgreSQL cerrada');
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    if (!this.pool) {
      throw new Error('Base de datos no configurada. Verifica DATABASE_URL.');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      this.logger.debug(`Query ejecutada en ${duration}ms`, { text, params });
      return result.rows;
    } catch (error) {
      this.logger.error('Error ejecutando query', { text, params, error });
      throw error;
    }
  }

  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Base de datos no configurada. Verifica DATABASE_URL.');
    }
    return await this.pool.connect();
  }

  getPool(): Pool | null {
    return this.pool || null;
  }
}

