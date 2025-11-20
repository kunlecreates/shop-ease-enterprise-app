import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Product } from './product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) code!: string;
  @Column() name!: string;
  @ManyToMany(() => Product, p => p.categories)
  products!: Product[];
}