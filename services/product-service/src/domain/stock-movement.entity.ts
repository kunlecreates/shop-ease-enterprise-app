import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

// Use simple-json for sqlite-based tests
const useSimpleJson = process.env.TEST_SQLITE === '1';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => Product, p => p.movements, { nullable: false })
  @JoinColumn({ name: 'productid' })
  product!: Product;
  @Column() quantity!: number;
  @Column({ type: 'varchar', length: 64 }) reason!: string;
  // In tests we run against sqlite in-memory which doesn't support jsonb.
  // Use `simple-json` for sqlite test runs when TEST_SQLITE=1.
  @Column({ type: (useSimpleJson ? 'simple-json' : 'jsonb') as any, nullable: true }) context?: Record<string, any>;
  @CreateDateColumn({ name: 'occurredat' }) occurredAt!: Date;
}