import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { ProductService } from '../application/product.service';
import { CreateProductDto } from './dto/create-product.dto';

// Controller paths should not include the global 'api' prefix (app.setGlobalPrefix('api')).
// This ensures routes are mounted as /api/<subpath> instead of /api/api/<subpath>.
@Controller('product')
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Get()
  async list(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    return this.service.listProducts({ page: p, limit: l });
  }

  @Post()
  async create(@Body() body: CreateProductDto) {
    return this.service.createProduct(body);
  }

  @Patch(':sku/stock')
  async adjustStock(@Param('sku') sku: string, @Body() body: { quantity: number; reason: string }) {
    return this.service.adjustStock(sku, body.quantity, body.reason);
  }
}