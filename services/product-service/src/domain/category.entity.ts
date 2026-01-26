import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('increment') id!: number;
  @Column({ type: 'varchar', length: 200, unique: true }) name!: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ name: 'is_active', default: true }) isActive!: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @ManyToMany(() => Product, p => p.categories)
  products!: Product[];
}