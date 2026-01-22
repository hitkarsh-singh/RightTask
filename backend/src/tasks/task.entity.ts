import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ default: 0 })
  priority: number; // For future ML prioritization

  @Column({ type: 'simple-json', nullable: true })
  dependencyIds: string[]; // Array of task IDs this task depends on

  @Column({ type: 'date', nullable: true })
  dueDate: Date; // For future critical path calculation

  @Column({ type: 'int', default: 0 })
  estimatedHours: number; // For future time-based analysis

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.tasks)
  user: User;

  @Column()
  userId: string;
}
