import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from '../domain/product.entity';
import { Category } from '../domain/category.entity';
import { StockMovement } from '../domain/stock-movement.entity';

export interface ProductSearchOptions {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: 'name' | 'price_asc' | 'price_desc';
}

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(StockMovement) private readonly movements: Repository<StockMovement>
  ) {}

  async createProduct(data: { sku: string; name: string; price: number; categoryCodes?: string[] }) {
    const cats: Category[] = [];
    if (data.categoryCodes) {
      for (const code of data.categoryCodes) {
        let cat = await this.categories.findOne({ where: { code } });
        if (!cat) {
          cat = this.categories.create({ code, name: code });
          cat = await this.categories.save(cat);
        }
        cats.push(cat);
      }
    }
    const prod = this.products.create({ sku: data.sku, name: data.name, price: data.price, categories: cats, active: true });
    return this.products.save(prod);
  }

  async listProducts(options?: ProductSearchOptions): Promise<Product[]> {
    if (!options) {
      return this.products.find();
    }

    const qb = this.products.createQueryBuilder('p');

    if (options.q) {
      qb.andWhere("p.search_vector @@ plainto_tsquery('english', :query)", { query: options.q });
    }

    if (options.category) {
      qb.innerJoin('p.categories', 'c')
        .andWhere('c.code = :category', { category: options.category });
    }

    if (options.minPrice !== undefined) {
      const minPriceCents = Math.round(options.minPrice * 100);
      qb.andWhere('p.priceCents >= :minPrice', { minPrice: minPriceCents });
    }

    if (options.maxPrice !== undefined) {
      const maxPriceCents = Math.round(options.maxPrice * 100);
      qb.andWhere('p.priceCents <= :maxPrice', { maxPrice: maxPriceCents });
    }

    if (options.inStock === true) {
      const stockSubQuery = this.movements
        .createQueryBuilder('m')
        .select('SUM(m.quantity)', 'stock')
        .where('m.productid = p.id')
        .getQuery();
      
      qb.andWhere(`(${stockSubQuery}) > 0`);
    }

    switch (options.sort) {
      case 'name':
        qb.orderBy('p.name', 'ASC');
        break;
      case 'price_asc':
        qb.orderBy('p.priceCents', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('p.priceCents', 'DESC');
        break;
      default:
        qb.orderBy('p.name', 'ASC');
    }

    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    qb.skip(skip).take(limit);

    return qb.getMany();
  }

  async searchProducts(query: string, pagination?: { page: number; limit: number }): Promise<Product[]> {
    const qb = this.products.createQueryBuilder('p');
    
    qb.where("p.search_vector @@ plainto_tsquery('english', :query)", { query })
      .orderBy("ts_rank(p.search_vector, plainto_tsquery('english', :query))", 'DESC')
      .setParameter('query', query);

    if (pagination) {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;
      qb.skip(skip).take(limit);
    }

    return qb.getMany();
  }

  async adjustStock(sku: string, quantity: number, reason: string) {
    if (!Number.isInteger(quantity) || quantity === 0) {
      throw new BadRequestException('Quantity must be a non-zero integer');
    }
    const product = await this.products.findOne({ where: { sku } });
    if (!product) throw new NotFoundException(`Product with sku ${sku} not found`);
    const current = await this.getStock(sku);
    const next = current + quantity;
    if (next < 0) throw new BadRequestException('Insufficient stock for decrement');
    const movement = this.movements.create({ product, quantity, reason });
    await this.movements.save(movement);
    return { sku, previous: current, new: next, reason };
  }

  async getStock(sku: string): Promise<number> {
    const product = await this.products.findOne({ where: { sku } });
    if (!product) throw new NotFoundException(`Product with sku ${sku} not found`);
    const result = await this.movements
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.quantity),0)', 'stock')
      .where('m.productid = :pid', { pid: product.id })
      .getRawOne<{ stock: string }>();
    return parseInt(result?.stock || '0', 10);
  }
}