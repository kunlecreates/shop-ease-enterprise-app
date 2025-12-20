import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './domain/product.entity';
import { Category } from './domain/category.entity';
import { StockMovement } from './domain/stock-movement.entity';
import { ProductService } from './application/product.service';
import { ProductController } from './presentation/product.controller';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const entities = [Product, Category, StockMovement];
        if (process.env.TEST_SQLITE) {
          return { type: 'sqlite', database: ':memory:', dropSchema: true, entities, synchronize: true };
        }
        return {
          type: 'postgres',
          host: process.env.PRODUCT_DB_HOST || process.env.POSTGRES_HOST || 'postgres',
          port: +(process.env.PRODUCT_DB_PORT || process.env.POSTGRES_PORT || 5432),
          username: process.env.PRODUCT_DB_USER || process.env.POSTGRES_USER || 'product_app',
          password: process.env.PRODUCT_DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'CHANGE_ME',
          database: process.env.PRODUCT_DB_NAME || process.env.POSTGRES_DB || 'product_svc',
          entities,
            synchronize: false,
            migrationsRun: process.env.MIGRATIONS_RUN === 'true',
          migrations: ['dist/migrations/*.js'],
          logging: false
        };
      }
    }),
    TypeOrmModule.forFeature([Product, Category, StockMovement])
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class AppModule {}