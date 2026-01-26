import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('increment') id!: number;
  @ManyToOne(() => Product, p => p.movements, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
  @Column({ name: 'change_qty' }) quantity!: number;
  @Column({ type: 'varchar', length: 64 }) reason!: string;
  @Column({ type: 'jsonb', nullable: true }) context?: Record<string, any>;
  @CreateDateColumn({ name: 'created_at' }) occurredAt!: Date;
}