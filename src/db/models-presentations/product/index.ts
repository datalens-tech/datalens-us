import {Model} from '../..';

export const ProductColumn = {
    ProductId: 'productId',
    Name: 'name',
} as const;

export class Product extends Model {
    static get tableName() {
        return 'products';
    }

    static get idColumn() {
        return 'productId';
    }

    [ProductColumn.ProductId]!: string;
    [ProductColumn.Name]!: string;
}
