import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { YjsModule } from './yjs/yjs.module';

@Module({
  imports: [
    // Configuration module for environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // TypeORM configuration for SQLite (easy setup, no external DB needed)
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'symbiotic-tasks.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Auto-create tables (dev only)
      logging: false,
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    TasksModule,
    YjsModule,
  ],
})
export class AppModule {}
