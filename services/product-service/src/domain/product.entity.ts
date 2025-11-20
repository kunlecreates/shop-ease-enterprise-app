import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Category } from './category.entity';
import { StockMovement } from './stock-movement.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) sku!: string;
  @Column() name!: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 }) price!: number;
  @Column({ default: true }) active!: boolean;
  @ManyToMany(() => Category, c => c.products, { cascade: true })
  @JoinTable({
    name: 'product_categories',
    joinColumn: { name: 'productsid', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoriesid', referencedColumnName: 'id' }
  })
  categories!: Category[];
  @OneToMany(() => StockMovement, m => m.product)
  movements!: StockMovement[];
}