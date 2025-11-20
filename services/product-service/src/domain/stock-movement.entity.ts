import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => Product, p => p.movements, { nullable: false })
  @JoinColumn({ name: 'productid' })
  product!: Product;
  @Column() quantity!: number;
  @Column({ type: 'varchar', length: 50 }) reason!: string;
  @CreateDateColumn({ name: 'occurredat' }) occurredAt!: Date;
}