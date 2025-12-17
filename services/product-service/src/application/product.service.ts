import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../domain/product.entity';
import { Category } from '../domain/category.entity';
import { StockMovement } from '../domain/stock-movement.entity';

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

  async listProducts(pagination?: { page: number; limit: number }): Promise<Product[]> {
    // For compatibility with an existing DB schema we avoid eager-loading
    // the categories join here and return products only for the smoke test.
    if (!pagination) {
      return this.products.find();
    }
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    return this.products.find({ skip, take: limit, order: { name: 'ASC' } });
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
      .where('m.productId = :pid', { pid: product.id })
      .getRawOne<{ stock: string }>();
    return parseInt(result?.stock || '0', 10);
  }
}