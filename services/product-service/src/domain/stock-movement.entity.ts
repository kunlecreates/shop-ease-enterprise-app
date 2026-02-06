import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' }) id!: number;
  @ManyToOne(() => Product, p => p.movements, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
  @Column({ name: 'change_qty', type: 'int' }) quantity!: number;
  @Column({ type: 'varchar', length: 64 }) reason!: string;
  @Column({ type: 'jsonb', nullable: true }) context?: Record<string, any>;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}