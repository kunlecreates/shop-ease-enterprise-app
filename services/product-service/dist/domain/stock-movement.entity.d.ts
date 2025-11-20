import { Product } from './product.entity';
export declare class StockMovement {
    id: string;
    product: Product;
    quantity: number;
    reason: string;
    occurredAt: Date;
}
