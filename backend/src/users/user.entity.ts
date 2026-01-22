import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Task } from '../tasks/task.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column()
  password: string; // Will be hashed

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Task, task => task.user)
  tasks: Task[];
}
