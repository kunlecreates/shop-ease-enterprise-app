"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const product_entity_1 = require("../domain/product.entity");
const category_entity_1 = require("../domain/category.entity");
const stock_movement_entity_1 = require("../domain/stock-movement.entity");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: +(process.env.POSTGRES_PORT || 5432),
    username: process.env.POSTGRES_USER || 'product_app',
    password: process.env.POSTGRES_PASSWORD || 'CHANGE_ME',
    database: process.env.POSTGRES_DB || 'product_svc',
    entities: [product_entity_1.Product, category_entity_1.Category, stock_movement_entity_1.StockMovement],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
    logging: false
});
exports.default = exports.AppDataSource;
//# sourceMappingURL=data-source.js.map