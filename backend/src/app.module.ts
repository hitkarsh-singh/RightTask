import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphModule } from './graph/graph.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { DependenciesModule } from './dependencies/dependencies.module';
import { YjsModule } from './yjs/yjs.module';

@Module({
  imports: [
    // Configuration module for environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // TypeORM configuration for better-sqlite3 (easy setup, no external DB needed)
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.NODE_ENV === 'production'
        ? '/app/data/symbiotic-tasks.db'  // Persisted in Railway volume
        : 'symbiotic-tasks.db',           // Local development
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Auto-create tables (dev only)
      logging: false,
    }),

    // Event emitter for event-driven architecture
    EventEmitterModule.forRoot(),

    // Graph database module (must come before feature modules)
    GraphModule,

    // Feature modules
    AuthModule,
    UsersModule,
    TasksModule,
    DependenciesModule,
    YjsModule,
  ],
})
export class AppModule {}
