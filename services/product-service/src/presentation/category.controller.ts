import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, HttpCode, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { CategoryService, CreateCategoryDto, UpdateCategoryDto } from '../application/category.service';
import { JwtAuthGuard } from '../config/jwt-auth.guard';

@Controller('category')
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  @Get()
  async listCategories() {
    return this.service.listCategories();
  }

  @Get(':id')
  async getCategoryById(@Param('id') id: string) {
    try {
      return await this.service.getCategoryById(parseInt(id, 10));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCategory(@Body() body: CreateCategoryDto, @Request() req: any) {
    if (!req.user.roles || !req.user.roles.includes('admin')) {
      throw new ForbiddenException('Only administrators can create categories');
    }
    
    try {
      return await this.service.createCategory(body);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateCategory(
    @Param('id') id: string,
    @Body() body: UpdateCategoryDto,
    @Request() req: any
  ) {
    if (!req.user.roles || !req.user.roles.includes('admin')) {
      throw new ForbiddenException('Only administrators can update categories');
    }

    try {
      return await this.service.updateCategory(parseInt(id, 10), body);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async deleteCategory(@Param('id') id: string, @Request() req: any) {
    if (!req.user.roles || !req.user.roles.includes('admin')) {
      throw new ForbiddenException('Only administrators can delete categories');
    }

    const deleted = await this.service.deleteCategory(parseInt(id, 10));
    if (!deleted) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return { message: 'Category deleted successfully', id };
  }
}
