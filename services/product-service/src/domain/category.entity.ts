import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' }) id!: number;
  @Column({ type: 'varchar', length: 64, unique: true, nullable: true }) code?: string;
  @Column({ type: 'varchar', length: 200, unique: true }) name!: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive!: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @ManyToMany(() => Product, p => p.categories)
  products!: Product[];
}