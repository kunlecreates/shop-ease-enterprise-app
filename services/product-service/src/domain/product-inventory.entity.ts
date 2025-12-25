import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, ValueTransformer } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_inventory')
export class ProductInventory {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'productid' })
  product!: Product;

  @Column({ type: 'text', nullable: true }) location?: string;

  // bigint columns return strings by default; transform to number for application convenience
  private static bigintTransformer: ValueTransformer = {
    to: (entityValue: number) => (entityValue === null || entityValue === undefined) ? entityValue : entityValue,
    from: (dbValue: string) => (dbValue === null || dbValue === undefined) ? 0 : parseInt(dbValue, 10)
  };

  @Column({ type: 'bigint', default: 0, transformer: ProductInventory.bigintTransformer }) quantity!: number;

  @Column({ type: 'bigint', default: 0, transformer: ProductInventory.bigintTransformer }) reserved!: number;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
