import { Repository } from 'typeorm';
import { Product } from '../domain/product.entity';
import { Category } from '../domain/category.entity';
import { StockMovement } from '../domain/stock-movement.entity';
export declare class ProductService {
    private readonly products;
    private readonly categories;
    private readonly movements;
    constructor(products: Repository<Product>, categories: Repository<Category>, movements: Repository<StockMovement>);
    createProduct(data: {
        sku: string;
        name: string;
        price: number;
        categoryCodes?: string[];
    }): Promise<Product>;
    listProducts(): Promise<Product[]>;
    adjustStock(sku: string, quantity: number, reason: string): Promise<{
        sku: string;
        previous: number;
        new: number;
        reason: string;
    }>;
    getStock(sku: string): Promise<number>;
}
