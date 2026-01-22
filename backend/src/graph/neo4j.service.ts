import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(Neo4jService.name);
  private driver: Driver;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const uri = this.configService.get<string>('NEO4J_URI');
    const username = this.configService.get<string>('NEO4J_USERNAME');
    const password = this.configService.get<string>('NEO4J_PASSWORD');

    if (!uri || !username || !password) {
      this.logger.warn('Neo4j credentials not found. Graph features will be disabled.');
      this.logger.warn('Please set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in .env');
      return;
    }

    try {
      this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
      await this.verifyConnection();
      await this.initializeSchema();
      this.logger.log('✓ Connected to Neo4j');
    } catch (error) {
      this.logger.error('Failed to connect to Neo4j:', error.message);
      this.logger.warn('Graph features will be disabled.');
    }
  }

  async onModuleDestroy() {
    if (this.driver) {
      await this.driver.close();
      this.logger.log('Neo4j connection closed');
    }
  }

  async verifyConnection(): Promise<void> {
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized');
    }

    const session = this.driver.session();
    try {
      await session.run('RETURN 1');
    } finally {
      await session.close();
    }
  }

  async initializeSchema(): Promise<void> {
    if (!this.driver) {
      return;
    }

    const session = this.driver.session();
    try {
      // Create unique constraint for Task ID
      await session.run(`
        CREATE CONSTRAINT task_id IF NOT EXISTS
        FOR (t:Task) REQUIRE t.id IS UNIQUE
      `);

      // Create unique constraint for User ID
      await session.run(`
        CREATE CONSTRAINT user_id IF NOT EXISTS
        FOR (u:User) REQUIRE u.id IS UNIQUE
      `);

      this.logger.log('Neo4j schema initialized');
    } catch (error) {
      this.logger.error('Failed to initialize schema:', error.message);
    } finally {
      await session.close();
    }
  }

  getSession(): Session {
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized');
    }
    return this.driver.session();
  }

  async executeQuery<T = any>(query: string, params: Record<string, any> = {}): Promise<T[]> {
    if (!this.driver) {
      this.logger.warn('Neo4j driver not initialized. Returning empty result.');
      return [];
    }

    const session = this.getSession();
    try {
      const result = await session.run(query, params);
      return result.records.map(record => record.toObject() as T);
    } finally {
      await session.close();
    }
  }

  async executeWrite(query: string, params: Record<string, any> = {}): Promise<void> {
    if (!this.driver) {
      this.logger.warn('Neo4j driver not initialized. Skipping write operation.');
      return;
    }

    const session = this.getSession();
    try {
      await session.run(query, params);
    } finally {
      await session.close();
    }
  }

  isConnected(): boolean {
    return !!this.driver;
  }
}
