import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CategoryController } from '../../src/presentation/category.controller';
import { CategoryService } from '../../src/application/category.service';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: jest.Mocked<CategoryService>;

  beforeEach(() => {
    service = {
      listCategories: jest.fn(),
      getCategoryById: jest.fn(),
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      ensureCategories: jest.fn(),
    } as unknown as jest.Mocked<CategoryService>;

    controller = new CategoryController(service);
  });

  it('lists categories', async () => {
    service.listCategories.mockResolvedValue([{ id: 1, name: 'Coffee', code: 'COFFEE' }] as never);
    await expect(controller.listCategories()).resolves.toEqual([{ id: 1, name: 'Coffee', code: 'COFFEE' }]);
  });

  it('returns category by id', async () => {
    service.getCategoryById.mockResolvedValue({ id: 2, name: 'Tea', code: 'TEA' } as never);
    await expect(controller.getCategoryById('2')).resolves.toEqual({ id: 2, name: 'Tea', code: 'TEA' });
  });

  it('maps unknown errors in getCategoryById to NotFoundException', async () => {
    service.getCategoryById.mockRejectedValue(new Error('db error') as never);
    await expect(controller.getCategoryById('12')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rethrows NotFoundException in getCategoryById', async () => {
    service.getCategoryById.mockRejectedValue(new NotFoundException('missing') as never);
    await expect(controller.getCategoryById('3')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects non-admin create', async () => {
    await expect(
      controller.createCategory({ name: 'Dairy' } as never, { user: { roles: ['user'] } } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates category for admin', async () => {
    service.createCategory.mockResolvedValue({ id: 4, name: 'Bakery', code: 'BAKERY' } as never);
    await expect(
      controller.createCategory({ name: 'Bakery' } as never, { user: { roles: ['admin'] } } as never),
    ).resolves.toEqual({ id: 4, name: 'Bakery', code: 'BAKERY' });
  });

  it('rethrows conflict errors on create', async () => {
    service.createCategory.mockRejectedValue(new ConflictException('dup') as never);
    await expect(
      controller.createCategory({ name: 'Dup' } as never, { user: { roles: ['ADMIN'] } } as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates category for admin', async () => {
    service.updateCategory.mockResolvedValue({ id: 5, name: 'Updated', code: 'UPDATED' } as never);
    await expect(
      controller.updateCategory('5', { name: 'Updated' } as never, { user: { roles: ['ADMIN'] } } as never),
    ).resolves.toEqual({ id: 5, name: 'Updated', code: 'UPDATED' });
  });

  it('rejects non-admin update and delete', async () => {
    await expect(
      controller.updateCategory('6', {} as never, { user: { roles: ['USER'] } } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      controller.deleteCategory('6', { user: { roles: ['USER'] } } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('deletes category and returns message', async () => {
    service.deleteCategory.mockResolvedValue(true);
    await expect(
      controller.deleteCategory('7', { user: { roles: ['admin'] } } as never),
    ).resolves.toEqual({ message: 'Category deleted successfully', id: '7' });
  });

  it('throws NotFoundException when delete returns false', async () => {
    service.deleteCategory.mockResolvedValue(false);
    await expect(
      controller.deleteCategory('8', { user: { roles: ['admin'] } } as never),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});