import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ProductService } from '../application/product.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Get()
  async list() {
    return this.service.listProducts();
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