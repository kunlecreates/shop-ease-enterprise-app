import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Product } from '../domain/product.entity';
import { Category } from '../domain/category.entity';
import { StockMovement } from '../domain/stock-movement.entity';
import { ProductInventory } from '../domain/product-inventory.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.PRODUCT_DB_HOST || process.env.POSTGRES_HOST || 'localhost',
  port: +(process.env.PRODUCT_DB_PORT || process.env.POSTGRES_PORT || 5432),
  username: process.env.PRODUCT_DB_USER || process.env.POSTGRES_USER || 'product_app',
  password: process.env.PRODUCT_DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'CHANGE_ME',
  database: process.env.PRODUCT_DB_NAME || process.env.POSTGRES_DB || 'product_svc',
  entities: [Product, Category, StockMovement, ProductInventory],
  synchronize: false,
  // Explicitly disable TypeORM migrations to avoid accidental execution.
  migrationsRun: false,
  migrations: [],
  logging: false
});

export default AppDataSource;