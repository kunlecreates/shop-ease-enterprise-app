import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany, CreateDateColumn, UpdateDateColumn, ValueTransformer } from 'typeorm';
import { Category } from './category.entity';
import { StockMovement } from './stock-movement.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 64, unique: true }) sku!: string;
  @Column({ type: 'varchar', length: 200 }) name!: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  // Store price as cents in DB (bigint). Provide a `price` virtual getter/setter for convenience.
  private static centsTransformer: ValueTransformer = {
    to: (entityValue: number) => (entityValue === null || entityValue === undefined) ? entityValue : Math.round(entityValue),
    from: (dbValue: string) => (dbValue === null || dbValue === undefined) ? 0 : parseInt(dbValue, 10)
  };

  @Column({ name: 'price_cents', type: 'bigint', default: 0, transformer: Product.centsTransformer }) priceCents!: number;

  // Expose a decimal price in dollars for API convenience. Setting `price` will update `priceCents`.
  get price(): number {
    return (this.priceCents ?? 0) / 100;
  }
  set price(v: number) {
    if (v === null || v === undefined) {
      this.priceCents = 0;
    } else {
      this.priceCents = Math.round(v * 100);
    }
  }
  // Use JSONB in production per Flyway migration.
  @Column({ type: 'jsonb', nullable: true }) attributes?: Record<string, any>;
  @Column({ type: 'char', length: 3, default: 'USD' }) currency!: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @Column({ name: 'is_active', default: true }) active!: boolean;
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