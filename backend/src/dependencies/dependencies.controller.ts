import { Controller, Post, Delete, Get, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DependenciesService } from './dependencies.service';
import { CreateDependencyDto } from './dto';

@Controller('dependencies')
@UseGuards(JwtAuthGuard)
export class DependenciesController {
  constructor(private dependenciesService: DependenciesService) {}

  @Post()
  async addDependency(@Body() dto: CreateDependencyDto, @Request() req) {
    await this.dependenciesService.addDependency(
      dto.taskId,
      dto.dependsOnTaskId,
      req.user.userId,
    );
    return { message: 'Dependency added successfully' };
  }

  @Delete()
  async removeDependency(@Body() dto: CreateDependencyDto, @Request() req) {
    await this.dependenciesService.removeDependency(
      dto.taskId,
      dto.dependsOnTaskId,
      req.user.userId,
    );
    return { message: 'Dependency removed successfully' };
  }

  @Get('task/:id')
  async getTaskDependencies(@Param('id') taskId: string, @Request() req) {
    const dependencies = await this.dependenciesService.getDependencies(
      taskId,
      req.user.userId,
    );
    return dependencies;
  }

  @Get('cycle-check')
  async checkCycle(
    @Query('taskId') taskId: string,
    @Query('newDependencyId') newDependencyId: string,
    @Request() req,
  ) {
    const hasCycle = await this.dependenciesService.checkCycle(
      taskId,
      newDependencyId,
      req.user.userId,
    );
    return { hasCycle };
  }
}

@Controller('graph')
@UseGuards(JwtAuthGuard)
export class GraphController {
  constructor(private dependenciesService: DependenciesService) {}

  @Get('user')
  async getUserGraph(@Request() req) {
    return this.dependenciesService.getTaskGraph(req.user.userId);
  }
}
