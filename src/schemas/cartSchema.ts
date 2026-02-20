import { z } from 'zod';

export const CartItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number().min(1),
    stock: z.number().optional().default(0),
    imageUrl: z.string().optional(),
}).passthrough();

export const CartItemsSchema = z.array(CartItemSchema);
