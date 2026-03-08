// Context & hooks
export { CartProvider, useCart } from './context/CartContext';

// Components
export { default as Cart } from './components/Cart';
export { default as CartProgress } from './components/CartProgress';
export { default as ShippingCalculator } from './components/ShippingCalculator';
// Pages
export { default as CartPage } from './pages/CartPage';

// Services
export { checkStockAvailability } from './services/orderService';
export { fetchOrders } from '@/services/orderService';

// Schemas
export { CartItemSchema, CartItemsSchema } from './schemas/cartSchema';

