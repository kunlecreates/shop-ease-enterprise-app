"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const product_entity_1 = require("../domain/product.entity");
const category_entity_1 = require("../domain/category.entity");
const stock_movement_entity_1 = require("../domain/stock-movement.entity");
const product_service_1 = require("./product.service");
describe('ProductService', () => {
    let service;
    beforeAll(async () => {
        const moduleRef = await testing_1.Test.createTestingModule({
            imports: [
                typeorm_1.TypeOrmModule.forRoot({ type: 'sqlite', database: ':memory:', dropSchema: true, entities: [product_entity_1.Product, category_entity_1.Category, stock_movement_entity_1.StockMovement], synchronize: true }),
                typeorm_1.TypeOrmModule.forFeature([product_entity_1.Product, category_entity_1.Category, stock_movement_entity_1.StockMovement])
            ],
            providers: [product_service_1.ProductService]
        }).compile();
        service = moduleRef.get(product_service_1.ProductService);
    });
    it('creates product and adjusts stock', async () => {
        const created = await service.createProduct({ sku: 'ABC123', name: 'Test Product', price: 9.99, categoryCodes: ['books'] });
        expect(created.id).toBeDefined();
        const afterInc = await service.adjustStock('ABC123', 10, 'initial load');
        expect(afterInc.new).toBe(10);
        const afterDec = await service.adjustStock('ABC123', -3, 'sale');
        expect(afterDec.new).toBe(7);
        const stock = await service.getStock('ABC123');
        expect(stock).toBe(7);
    });
});
//# sourceMappingURL=product.service.spec.js.map