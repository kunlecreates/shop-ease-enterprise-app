import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class InitSchema1732100000000 implements MigrationInterface {
  name = 'InitSchema1732100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await queryRunner.createTable(new Table({
      name: 'products',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: `gen_random_uuid()` },
        { name: 'sku', type: 'varchar', isUnique: true },
        { name: 'name', type: 'varchar' },
        { name: 'description', type: 'text', isNullable: true },
        { name: 'price', type: 'decimal', precision: 10, scale: 2, default: '0' },
        { name: 'active', type: 'boolean', default: 'true' }
      ]
    }));
    await queryRunner.createTable(new Table({
      name: 'categories',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: `gen_random_uuid()` },
        { name: 'code', type: 'varchar', isUnique: true },
        { name: 'name', type: 'varchar' }
      ]
    }));
    await queryRunner.createTable(new Table({
      name: 'product_categories',
      columns: [
        { name: 'productsid', type: 'uuid', isPrimary: true },
        { name: 'categoriesid', type: 'uuid', isPrimary: true }
      ]
    }));
    await queryRunner.createForeignKey('product_categories', new TableForeignKey({
      columnNames: ['productsid'],
      referencedTableName: 'products',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE'
    }));
    await queryRunner.createForeignKey('product_categories', new TableForeignKey({
      columnNames: ['categoriesid'],
      referencedTableName: 'categories',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE'
    }));
    await queryRunner.createTable(new Table({
      name: 'stock_movements',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: `gen_random_uuid()` },
        { name: 'productid', type: 'uuid' },
        { name: 'quantity', type: 'integer' },
        { name: 'reason', type: 'varchar' },
        { name: 'occurredat', type: 'timestamptz', isNullable: true, default: 'CURRENT_TIMESTAMP' }
      ]
    }));
    await queryRunner.createForeignKey('stock_movements', new TableForeignKey({
      columnNames: ['productid'],
      referencedTableName: 'products',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE'
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('stock_movements');
    await queryRunner.dropTable('product_categories');
    await queryRunner.dropTable('categories');
    await queryRunner.dropTable('products');
  }
}