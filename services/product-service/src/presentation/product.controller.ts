import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ProductService } from '../application/product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../config/jwt-auth.guard';

@Controller('product')
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('inStock') inStock?: string,
    @Query('sort') sort?: 'name' | 'price_asc' | 'price_desc'
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    
    const options = {
      page: p,
      limit: l,
      q: q?.trim(),
      category: category?.trim(),
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      inStock: inStock === 'true',
      sort
    };
    
    return this.service.listProducts(options);
  }

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    
    return this.service.searchProducts(query.trim(), { page: p, limit: l });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: CreateProductDto, @Request() req: any) {
    if (!req.user.roles || !req.user.roles.includes('ADMIN')) {
      throw new ForbiddenException('Only administrators can create products');
    }
    return this.service.createProduct(body);
  }

  @Patch(':sku/stock')
  @UseGuards(JwtAuthGuard)
  async adjustStock(@Param('sku') sku: string, @Body() body: { quantity: number; reason: string }, @Request() req: any) {
    if (!req.user.roles || !req.user.roles.includes('ADMIN')) {
      throw new ForbiddenException('Only administrators can adjust stock levels');
    }
    return this.service.adjustStock(sku, body.quantity, body.reason);
  }
}