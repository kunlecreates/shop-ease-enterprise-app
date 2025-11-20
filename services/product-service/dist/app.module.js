"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const product_entity_1 = require("./domain/product.entity");
const category_entity_1 = require("./domain/category.entity");
const stock_movement_entity_1 = require("./domain/stock-movement.entity");
const product_service_1 = require("./application/product.service");
const product_controller_1 = require("./presentation/product.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                useFactory: () => {
                    const entities = [product_entity_1.Product, category_entity_1.Category, stock_movement_entity_1.StockMovement];
                    if (process.env.TEST_SQLITE) {
                        return { type: 'sqlite', database: ':memory:', dropSchema: true, entities, synchronize: true };
                    }
                    return {
                        type: 'postgres',
                        host: process.env.POSTGRES_HOST || 'postgres',
                        port: +(process.env.POSTGRES_PORT || 5432),
                        username: process.env.POSTGRES_USER || 'product_app',
                        password: process.env.POSTGRES_PASSWORD || 'CHANGE_ME',
                        database: process.env.POSTGRES_DB || 'product_svc',
                        entities,
                        synchronize: false,
                        migrationsRun: process.env.MIGRATIONS_RUN === 'true',
                        migrations: ['dist/migrations/*.js'],
                        logging: false
                    };
                }
            }),
            typeorm_1.TypeOrmModule.forFeature([product_entity_1.Product, category_entity_1.Category, stock_movement_entity_1.StockMovement])
        ],
        controllers: [product_controller_1.ProductController],
        providers: [product_service_1.ProductService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map