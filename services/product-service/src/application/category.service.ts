import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../domain/category.entity';

export interface CreateCategoryDto {
  name: string;
  description?: string;
  slug?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  slug?: string;
  isActive?: boolean;
}

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category) private readonly categories: Repository<Category>
  ) {}

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    const existing = await this.categories.findOne({ where: { name: data.name } });
    if (existing) {
      throw new ConflictException(`Category with name '${data.name}' already exists`);
    }

    const category = this.categories.create({
      name: data.name,
      description: data.description,
      isActive: true
    });

    return this.categories.save(category);
  }

  async listCategories(): Promise<Category[]> {
    return this.categories.find({ 
      where: { isActive: true },
      order: { name: 'ASC' }
    });
  }

  async getCategoryById(id: number): Promise<Category> {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async updateCategory(id: number, data: UpdateCategoryDto): Promise<Category> {
    const category = await this.getCategoryById(id);

    if (data.name && data.name !== category.name) {
      const existing = await this.categories.findOne({ where: { name: data.name } });
      if (existing) {
        throw new ConflictException(`Category with name '${data.name}' already exists`);
      }
      category.name = data.name;
    }

    if (data.description !== undefined) {
      category.description = data.description;
    }

    if (data.isActive !== undefined) {
      category.isActive = data.isActive;
    }

    return this.categories.save(category);
  }

  async deleteCategory(id: number): Promise<boolean> {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) {
      return false;
    }

    await this.categories.remove(category);
    return true;
  }
}
