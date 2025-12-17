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
    const spy = jest.spyOn(productRepo, 'find').mockResolvedValue([{ id: 1 } as any, { id: 2 } as any]);
    const res = await service.listProducts();
    expect(spy).toHaveBeenCalledWith();
    expect(res).toHaveLength(2);
  });

  it('listProducts with pagination uses skip/take', async () => {
    const spy = jest.spyOn(productRepo, 'find').mockResolvedValue([{ id: 3 } as any]);
    const res = await service.listProducts({ page: 2, limit: 10 });
    expect(spy).toHaveBeenCalledWith({ skip: 10, take: 10, order: { name: 'ASC' } });
    expect(res).toHaveLength(1);
  });
});
