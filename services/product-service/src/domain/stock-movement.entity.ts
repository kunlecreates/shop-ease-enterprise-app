import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => Product, p => p.movements, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
  @Column() quantity!: number;
  @Column({ type: 'varchar', length: 64 }) reason!: string;
  @Column({ type: 'jsonb', nullable: true }) context?: Record<string, any>;
  @CreateDateColumn({ name: 'occurredat' }) occurredAt!: Date;
}