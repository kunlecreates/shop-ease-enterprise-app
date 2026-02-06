import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_inventory')
export class ProductInventory {
  // product_id is the PK (one-to-one with products)
  @PrimaryColumn({ name: 'product_id', type: 'bigint' })
  productId!: number;

  @OneToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  // Use bigint for quantity/reserved to match DB schema
  private static bigintTransformer = {
    to: (entityValue: number) => entityValue,
    from: (dbValue: string) => (dbValue == null ? BigInt(0) : BigInt(dbValue))
  };

  @Column({ type: 'bigint', default: 0, transformer: ProductInventory.bigintTransformer }) quantity!: bigint;
  @Column({ type: 'bigint', default: 0, transformer: ProductInventory.bigintTransformer }) reserved!: bigint;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
