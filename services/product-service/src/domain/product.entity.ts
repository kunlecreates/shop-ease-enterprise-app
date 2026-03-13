import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany, CreateDateColumn, UpdateDateColumn, ValueTransformer } from 'typeorm';
import { Category } from './category.entity';
import { StockMovement } from './stock-movement.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' }) id!: number;
  @Column({ type: 'varchar', length: 64, unique: true, nullable: false }) sku!: string;
  @Column({ type: 'varchar', length: 200, nullable: false }) name!: string;
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
  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true }) imageUrl?: string;
  @Column({ type: 'varchar', length: 50, nullable: true }) aisle?: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) section?: string;
  @Column({ name: 'shelf_location', type: 'varchar', length: 100, nullable: true }) shelfLocation?: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @Column({ name: 'is_active', type: 'boolean', default: true }) active!: boolean;
  @ManyToMany(() => Category, c => c.products)
  @JoinTable({
    name: 'product_categories',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' }
  })
  categories!: Category[];
  @OneToMany(() => StockMovement, m => m.product)
  movements!: StockMovement[];

  toJSON() {
    const stock = this.movements?.reduce((sum, m) => sum + m.quantity, 0) ?? 0;
    
    // Extract category and unit from attributes if categories array is empty
    let categoryList: any[] = this.categories || [];
    let unit = undefined;
    
    if (this.attributes) {
      // If no ManyToMany categories, use the category from attributes
      if (categoryList.length === 0 && this.attributes.category) {
        categoryList = [{ name: this.attributes.category }];
      }
      // Extract unit from attributes
      if (this.attributes.unit) {
        unit = this.attributes.unit;
      }
    }
    
    return {
      id: this.id,
      sku: this.sku,
      name: this.name,
      description: this.description,
      price: this.price,
      priceCents: this.priceCents,
      currency: this.currency,
      attributes: this.attributes,
      imageUrl: this.imageUrl,
      aisle: this.aisle,
      section: this.section,
      shelfLocation: this.shelfLocation,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      categories: categoryList,
      unit: unit,
      stock: stock
    };
  }
}