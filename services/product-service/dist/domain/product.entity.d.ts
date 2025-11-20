import { Category } from './category.entity';
import { StockMovement } from './stock-movement.entity';
export declare class Product {
    id: string;
    sku: string;
    name: string;
    description?: string;
    price: number;
    active: boolean;
    categories: Category[];
    movements: StockMovement[];
}
