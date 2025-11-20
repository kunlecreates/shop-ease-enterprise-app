"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../domain/product.entity");
const category_entity_1 = require("../domain/category.entity");
const stock_movement_entity_1 = require("../domain/stock-movement.entity");
let ProductService = class ProductService {
    products;
    categories;
    movements;
    constructor(products, categories, movements) {
        this.products = products;
        this.categories = categories;
        this.movements = movements;
    }
    async createProduct(data) {
        const cats = [];
        if (data.categoryCodes) {
            for (const code of data.categoryCodes) {
                let cat = await this.categories.findOne({ where: { code } });
                if (!cat) {
                    cat = this.categories.create({ code, name: code });
                    cat = await this.categories.save(cat);
                }
                cats.push(cat);
            }
        }
        const prod = this.products.create({ sku: data.sku, name: data.name, price: data.price, categories: cats, active: true });
        return this.products.save(prod);
    }
    async listProducts() {
        return this.products.find();
    }
    async adjustStock(sku, quantity, reason) {
        if (!Number.isInteger(quantity) || quantity === 0) {
            throw new common_1.BadRequestException('Quantity must be a non-zero integer');
        }
        const product = await this.products.findOne({ where: { sku } });
        if (!product)
            throw new common_1.NotFoundException(`Product with sku ${sku} not found`);
        const current = await this.getStock(sku);
        const next = current + quantity;
        if (next < 0)
            throw new common_1.BadRequestException('Insufficient stock for decrement');
        const movement = this.movements.create({ product, quantity, reason });
        await this.movements.save(movement);
        return { sku, previous: current, new: next, reason };
    }
    async getStock(sku) {
        const product = await this.products.findOne({ where: { sku } });
        if (!product)
            throw new common_1.NotFoundException(`Product with sku ${sku} not found`);
        const result = await this.movements
            .createQueryBuilder('m')
            .select('COALESCE(SUM(m.quantity),0)', 'stock')
            .where('m.productId = :pid', { pid: product.id })
            .getRawOne();
        return parseInt(result?.stock || '0', 10);
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(2, (0, typeorm_1.InjectRepository)(stock_movement_entity_1.StockMovement)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ProductService);
//# sourceMappingURL=product.service.js.map