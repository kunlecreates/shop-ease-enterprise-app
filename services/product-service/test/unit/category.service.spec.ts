import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoryService } from '../../src/application/category.service';
import { Category } from '../../src/domain/category.entity';

describe('CategoryService', () => {
  let service: CategoryService;
  let categoryRepo: Repository<Category>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: getRepositoryToken(Category), useClass: Repository },
      ],
    }).compile();

    service = module.get(CategoryService);
    categoryRepo = module.get(getRepositoryToken(Category));
  });

  // createCategory() tests
  describe('createCategory', () => {
    it('should create new category successfully', async () => {
      const mockCategory = { id: 1, name: 'Electronics', description: 'Electronic items', isActive: true } as Category;

      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(categoryRepo, 'create').mockReturnValue(mockCategory);
      jest.spyOn(categoryRepo, 'save').mockResolvedValue(mockCategory);

      const result = await service.createCategory({ name: 'Electronics', description: 'Electronic items' });

      expect(result).toEqual(mockCategory);
      expect(categoryRepo.findOne).toHaveBeenCalledWith({ where: { name: 'Electronics' } });
      expect(categoryRepo.create).toHaveBeenCalledWith({
        name: 'Electronics',
        description: 'Electronic items',
        isActive: true
      });
    });

    it('should throw ConflictException for duplicate name', async () => {
      const existingCategory = { id: 1, name: 'Electronics' } as Category;

      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(existingCategory);

      await expect(service.createCategory({ name: 'Electronics' }))
        .rejects
        .toThrow(ConflictException);

      await expect(service.createCategory({ name: 'Electronics' }))
        .rejects
        .toThrow("Category with name 'Electronics' already exists");
    });
  });

  // listCategories() tests
  describe('listCategories', () => {
    it('should return only active categories sorted by name', async () => {
      const mockCategories = [
        { id: 1, name: 'Books', isActive: true },
        { id: 2, name: 'Electronics', isActive: true },
      ] as Category[];

      jest.spyOn(categoryRepo, 'find').mockResolvedValue(mockCategories);

      const result = await service.listCategories();

      expect(result).toEqual(mockCategories);
      expect(categoryRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: 'ASC' }
      });
    });
  });

  // getCategoryById() tests
  describe('getCategoryById', () => {
    it('should return category for valid ID', async () => {
      const mockCategory = { id: 1, name: 'Electronics' } as Category;

      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(mockCategory);

      const result = await service.getCategoryById(1);

      expect(result).toEqual(mockCategory);
      expect(categoryRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException for invalid ID', async () => {
      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getCategoryById(999))
        .rejects
        .toThrow(NotFoundException);

      await expect(service.getCategoryById(999))
        .rejects
        .toThrow('Category with ID 999 not found');
    });
  });

  // updateCategory() tests
  describe('updateCategory', () => {
    it('should update category name with duplicate validation', async () => {
      const mockCategory = { id: 1, name: 'Electronics', description: 'Old desc', isActive: true } as Category;

      jest.spyOn(categoryRepo, 'findOne')
        .mockResolvedValueOnce(mockCategory) // getCategoryById call
        .mockResolvedValueOnce(null); // duplicate name check
      jest.spyOn(categoryRepo, 'save').mockResolvedValue({ ...mockCategory, name: 'Gadgets' } as Category);

      const result = await service.updateCategory(1, { name: 'Gadgets' });

      expect(result.name).toBe('Gadgets');
      expect(categoryRepo.save).toHaveBeenCalled();
    });

    it('should update description and isActive fields', async () => {
      const mockCategory = { id: 1, name: 'Electronics', description: 'Old desc', isActive: true } as Category;
      const updated = { ...mockCategory, description: 'New desc', isActive: false };

      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(mockCategory);
      jest.spyOn(categoryRepo, 'save').mockResolvedValue(updated);

      const result = await service.updateCategory(1, { description: 'New desc', isActive: false });

      expect(mockCategory.description).toBe('New desc');
      expect(mockCategory.isActive).toBe(false);
      expect(categoryRepo.save).toHaveBeenCalledWith(mockCategory);
    });

    it('should throw NotFoundException for invalid ID', async () => {
      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(null);

      await expect(service.updateCategory(999, { name: 'Test' }))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw ConflictException when new name already exists', async () => {
      const mockCategory = { id: 1, name: 'Electronics' } as Category;
      const existingCategory = { id: 2, name: 'Gadgets' } as Category;

      jest.spyOn(categoryRepo, 'findOne')
        .mockResolvedValueOnce(mockCategory) // getCategoryById
        .mockResolvedValueOnce(existingCategory); // duplicate check

      await expect(service.updateCategory(1, { name: 'Gadgets' }))
        .rejects
        .toThrow(ConflictException);
    });
  });

  // deleteCategory() tests
  describe('deleteCategory', () => {
    it('should delete existing category', async () => {
      const mockCategory = { id: 1, name: 'Electronics' } as Category;

      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(mockCategory);
      jest.spyOn(categoryRepo, 'remove').mockResolvedValue(mockCategory);

      const result = await service.deleteCategory(1);

      expect(result).toBe(true);
      expect(categoryRepo.remove).toHaveBeenCalledWith(mockCategory);
    });

    it('should return false for non-existent category', async () => {
      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(null);
      const removeSpy = jest.spyOn(categoryRepo, 'remove');

      const result = await service.deleteCategory(999);

      expect(result).toBe(false);
      expect(removeSpy).not.toHaveBeenCalled();
    });
  });
});
