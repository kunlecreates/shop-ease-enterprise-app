import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request, Delete, HttpCode, ForbiddenException, NotFoundException, ConflictException, Put } from '@nestjs/common';
import { ProductService } from '../application/product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../config/jwt-auth.guard';
import { InternalApiKeyGuard } from '../guards/internal-api-key.guard';

@Controller('product')
export class ProductController {
  constructor(private readonly service: ProductService) {}

  private hasRole(user: any, role: string): boolean {
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      return false;
    }
    return user.roles.some((r: string) => r.toLowerCase() === role.toLowerCase());
  }

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
    if (!this.hasRole(req.user, 'admin')) {
      throw new ForbiddenException('Only administrators can create products');
    }
    try {
      return await this.service.createProduct(body);
    } catch (error: any) {
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        throw new ConflictException(`Product with SKU '${body.sku}' already exists`);
      }
      throw error;
    }
  }

  @Put(':sku')
  @UseGuards(JwtAuthGuard)
  async update(@Param('sku') sku: string, @Body() body: UpdateProductDto, @Request() req: any) {
    if (!this.hasRole(req.user, 'admin')) {
      throw new ForbiddenException('Only administrators can update products');
    }
    const updated = await this.service.updateProduct(sku, body);
    if (!updated) {
      throw new NotFoundException(`Product with SKU '${sku}' not found`);
    }
    return updated;
  }

  @Get('inventory')
  async getInventorySummary() {
    try {
      const products = await this.service.listProducts();
      const inventory = products.map(p => ({
        sku: p.sku,
        name: p.name,
        stock: p.toJSON().stock
      }));
      return { total: inventory.length, items: inventory };
    } catch (error) {
      return { total: 0, items: [] };
    }
  }

  @Get(':sku')
  async getProductBySku(@Param('sku') sku: string) {
    const product = await this.service.getProductBySku(sku);
    if (!product) {
      throw new NotFoundException(`Product with SKU '${sku}' not found`);
    }
    return product;
  }

  @Patch(':sku/stock')
  @UseGuards(JwtAuthGuard)
  async adjustStock(@Param('sku') sku: string, @Body() body: { adjustment?: number; quantity?: number; reason?: string }, @Request() req: any) {
    if (!this.hasRole(req.user, 'admin')) {
      throw new ForbiddenException('Only administrators can adjust stock levels');
    }
    const adjustment = body.adjustment ?? body.quantity ?? 0;
    return this.service.adjustStock(sku, adjustment, body.reason || 'Manual adjustment');
  }

  /**
   * Internal service-to-service stock adjustment endpoint.
   * Secured by X-Internal-Api-Key header — not accessible to end users.
   * Called by order-service to reconcile stock on PAID, CANCELLED, and REFUNDED transitions.
   */
  @Patch('internal/:sku/stock')
  @UseGuards(InternalApiKeyGuard)
  async adjustStockInternal(
    @Param('sku') sku: string,
    @Body() body: { adjustment: number; reason?: string },
  ) {
    return this.service.adjustStock(sku, body.adjustment, body.reason || 'Order fulfillment');
  }

  @Delete(':sku')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async deleteProduct(@Param('sku') sku: string, @Request() req: any) {
    if (!this.hasRole(req.user, 'admin')) {
      throw new ForbiddenException('Only administrators can delete products');
    }
    const deleted = await this.service.deleteProduct(sku);
    if (!deleted) {
      throw new NotFoundException(`Product with SKU '${sku}' not found`);
    }
    return { message: 'Product deleted successfully', sku };
  }
}