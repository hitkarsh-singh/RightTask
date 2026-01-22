import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Neo4jService } from './neo4j.service';
import { GraphSyncService } from './graph-sync.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [Neo4jService, GraphSyncService],
  exports: [Neo4jService, GraphSyncService],
})
export class GraphModule {}
