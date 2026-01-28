import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductService } from '../src/application/product.service';
import { Product } from '../src/domain/product.entity';
import { Category } from '../src/domain/category.entity';
import { StockMovement } from '../src/domain/stock-movement.entity';

describe('ProductService', () => {
  let service: ProductService;
  let productRepo: Repository<Product>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getRepositoryToken(Product), useClass: Repository },
        { provide: getRepositoryToken(Category), useClass: Repository },
        { provide: getRepositoryToken(StockMovement), useClass: Repository },
      ],
    }).compile();

    service = module.get(ProductService);
    productRepo = module.get(getRepositoryToken(Product));
  });

  it('listProducts without pagination returns all', async () => {
    const spy = jest.spyOn(productRepo, 'find').mockResolvedValue([
      { id: 1 } as any,
      { id: 2 } as any,
    ]);
    const res = await service.listProducts();
    expect(spy).toHaveBeenCalledWith({ relations: ['movements'] });
    expect(res).toHaveLength(2);
  });

  it('listProducts with pagination uses skip/take', async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        { id: 3 } as any,
      ]),
    };
    jest.spyOn(productRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
    const res = await service.listProducts({ page: 2, limit: 10 });
    expect(productRepo.createQueryBuilder).toHaveBeenCalledWith('p');
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('p.movements', 'movements');
    expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
    expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    expect(res).toHaveLength(1);
  });
});
