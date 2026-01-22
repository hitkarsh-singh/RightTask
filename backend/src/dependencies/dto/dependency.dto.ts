import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDependencyDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  dependsOnTaskId: string;
}
