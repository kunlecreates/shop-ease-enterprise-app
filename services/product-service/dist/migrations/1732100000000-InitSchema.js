"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitSchema1732100000000 = void 0;
const typeorm_1 = require("typeorm");
class InitSchema1732100000000 {
    name = 'InitSchema1732100000000';
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'products',
            columns: [
                { name: 'id', type: 'uuid', isPrimary: true },
                { name: 'sku', type: 'varchar', isUnique: true },
                { name: 'name', type: 'varchar' },
                { name: 'description', type: 'text', isNullable: true },
                { name: 'price', type: 'decimal', precision: 10, scale: 2, default: '0' },
                { name: 'active', type: 'boolean', default: 'true' }
            ]
        }));
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'categories',
            columns: [
                { name: 'id', type: 'uuid', isPrimary: true },
                { name: 'code', type: 'varchar', isUnique: true },
                { name: 'name', type: 'varchar' }
            ]
        }));
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'product_categories',
            columns: [
                { name: 'productsId', type: 'uuid', isPrimary: true },
                { name: 'categoriesId', type: 'uuid', isPrimary: true }
            ]
        }));
        await queryRunner.createForeignKey('product_categories', new typeorm_1.TableForeignKey({
            columnNames: ['productsId'],
            referencedTableName: 'products',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE'
        }));
        await queryRunner.createForeignKey('product_categories', new typeorm_1.TableForeignKey({
            columnNames: ['categoriesId'],
            referencedTableName: 'categories',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE'
        }));
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'stock_movements',
            columns: [
                { name: 'id', type: 'uuid', isPrimary: true },
                { name: 'productId', type: 'uuid' },
                { name: 'quantity', type: 'integer' },
                { name: 'reason', type: 'varchar' },
                { name: 'occurredAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
            ]
        }));
        await queryRunner.createForeignKey('stock_movements', new typeorm_1.TableForeignKey({
            columnNames: ['productId'],
            referencedTableName: 'products',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE'
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropTable('stock_movements');
        await queryRunner.dropTable('product_categories');
        await queryRunner.dropTable('categories');
        await queryRunner.dropTable('products');
    }
}
exports.InitSchema1732100000000 = InitSchema1732100000000;
//# sourceMappingURL=1732100000000-InitSchema.js.map