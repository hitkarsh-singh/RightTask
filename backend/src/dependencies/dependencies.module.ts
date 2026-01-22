import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/task.entity';
import { GraphModule } from '../graph/graph.module';
import { DependenciesService } from './dependencies.service';
import { DependenciesController, GraphController } from './dependencies.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    GraphModule,
  ],
  providers: [DependenciesService],
  controllers: [DependenciesController, GraphController],
  exports: [DependenciesService],
})
export class DependenciesModule {}
