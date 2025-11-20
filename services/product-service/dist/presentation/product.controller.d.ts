import { ProductService } from '../application/product.service';
import { CreateProductDto } from './dto/create-product.dto';
export declare class ProductController {
    private readonly service;
    constructor(service: ProductService);
    list(): Promise<import("../domain/product.entity").Product[]>;
    create(body: CreateProductDto): Promise<import("../domain/product.entity").Product>;
    adjustStock(sku: string, body: {
        quantity: number;
        reason: string;
    }): Promise<{
        sku: string;
        previous: number;
        new: number;
        reason: string;
    }>;
}
