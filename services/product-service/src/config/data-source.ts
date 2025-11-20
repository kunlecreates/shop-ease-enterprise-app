import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Product } from '../domain/product.entity';
import { Category } from '../domain/category.entity';
import { StockMovement } from '../domain/stock-movement.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: +(process.env.POSTGRES_PORT || 5432),
  username: process.env.POSTGRES_USER || 'product_app',
  password: process.env.POSTGRES_PASSWORD || 'CHANGE_ME',
  database: process.env.POSTGRES_DB || 'product_svc',
  entities: [Product, Category, StockMovement],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false
});

export default AppDataSource;