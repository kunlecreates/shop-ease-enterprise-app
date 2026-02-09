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

  async createProduct(data: { 
    sku: string; 
    name: string; 
    description?: string; 
    price?: number; 
    priceCents?: number; 
    currency?: string; 
    imageUrl?: string;
    aisle?: string;
    section?: string;
    shelfLocation?: string;
    categoryCodes?: string[]; 
    initialStock?: number 
  }) {
    const cats: Category[] = [];
    if (data.categoryCodes) {
      for (const code of data.categoryCodes) {
        // map incoming category code to category `name` field in the DB
        let cat = await this.categories.findOne({ where: { name: code } });
        if (!cat) {
          cat = this.categories.create({ name: code });
          cat = await this.categories.save(cat);
        }
        cats.push(cat);
      }
    }
    
    const prod = this.products.create({ 
      sku: data.sku, 
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      aisle: data.aisle,
      section: data.section,
      shelfLocation: data.shelfLocation,
      categories: cats, 
      active: true,
      currency: data.currency || 'USD'
    });
    
    // Handle both price (decimal) and priceCents (integer) formats
    if (data.priceCents !== undefined) {
      prod.priceCents = data.priceCents;
    } else if (data.price !== undefined) {
      prod.price = data.price;
    } else {
      prod.priceCents = 0;
    }
    
    const saved = await this.products.save(prod);

    // If initialStock is provided, create an initial stock movement
    if (data.initialStock !== undefined && Number.isInteger(data.initialStock) && data.initialStock !== 0) {
      const qty = data.initialStock;
      const movement = this.movements.create({ product: saved, quantity: qty, reason: 'Initial stock' });
      await this.movements.save(movement);
    }

    // Return product with relations (categories and movements) so callers can see stock
    return this.products.findOne({ where: { id: saved.id }, relations: ['categories', 'movements'] });
  }

  async updateProduct(sku: string, data: {
    name?: string;
    description?: string;
    price?: number;
    priceCents?: number;
    currency?: string;
    imageUrl?: string;
    aisle?: string;
    section?: string;
    shelfLocation?: string;
    categoryCodes?: string[];
  }): Promise<Product | null> {
    const product = await this.products.findOne({ where: { sku }, relations: ['categories'] });
    if (!product) {
      throw new NotFoundException(`Product with sku ${sku} not found`);
    }

    if (data.name !== undefined) product.name = data.name;
    if (data.description !== undefined) product.description = data.description;
    if (data.currency !== undefined) product.currency = data.currency;
    if (data.imageUrl !== undefined) product.imageUrl = data.imageUrl;
    if (data.aisle !== undefined) product.aisle = data.aisle;
    if (data.section !== undefined) product.section = data.section;
    if (data.shelfLocation !== undefined) product.shelfLocation = data.shelfLocation;

    if (data.priceCents !== undefined) {
      product.priceCents = data.priceCents;
    } else if (data.price !== undefined) {
      product.price = data.price;
    }

    if (data.categoryCodes !== undefined) {
      const cats: Category[] = [];
      for (const code of data.categoryCodes) {
        let cat = await this.categories.findOne({ where: { name: code } });
        if (!cat) {
          cat = this.categories.create({ name: code });
          cat = await this.categories.save(cat);
        }
        cats.push(cat);
      }
      product.categories = cats;
    }

    await this.products.save(product);
    return this.products.findOne({ where: { sku }, relations: ['categories', 'movements'] });
  }

  async listProducts(options?: ProductSearchOptions): Promise<Product[]> {
    if (!options) {
      return this.products.find({ relations: ['movements', 'categories'] });
    }

    const qb = this.products.createQueryBuilder('p')
      .leftJoinAndSelect('p.movements', 'movements')
      .leftJoinAndSelect('p.categories', 'categories');

    if (options.q) {
      qb.andWhere("to_tsvector('english', coalesce(p.name,'') || ' ' || coalesce(p.description,'')) @@ plainto_tsquery('english', :query)", { query: options.q });
    }

    if (options.category) {
      qb.andWhere('categories.name = :category', { category: options.category });
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
        .select('SUM(m.change_qty)', 'stock')
        .where('m.product_id = p.id')
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
    const qb = this.products.createQueryBuilder('p')
      .leftJoinAndSelect('p.movements', 'movements');

    qb.where("to_tsvector('english', coalesce(p.name,'') || ' ' || coalesce(p.description,'')) @@ plainto_tsquery('english', :query)", { query })
      .orderBy("ts_rank(to_tsvector('english', coalesce(p.name,'') || ' ' || coalesce(p.description,'')), plainto_tsquery('english', :query))", 'DESC')
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
    return { sku, previous: current, new: next, stock: next, reason };
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    return this.products.findOne({ where: { sku }, relations: ['categories', 'movements'] });
  }

  async deleteProduct(sku: string): Promise<boolean> {
    const product = await this.products.findOne({ where: { sku } });
    if (!product) {
      return false;
    }
    await this.products.remove(product);
    return true;
  }

  async getStock(sku: string): Promise<number> {
    const product = await this.products.findOne({ where: { sku } });
    if (!product) throw new NotFoundException(`Product with sku ${sku} not found`);
    const result = await this.movements
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.change_qty),0)', 'stock')
      .where('m.product_id = :pid', { pid: product.id })
      .getRawOne<{ stock: string }>();
    return parseInt(result?.stock || '0', 10);
  }
}