// Context & hooks
export { CartProvider, useCart } from './context/CartContext';

// Components
export { default as Cart } from './components/Cart';
export { default as CartProgress } from './components/CartProgress';
export { default as ShippingCalculator } from './components/ShippingCalculator';
export { default as AddressEditModal } from './components/AddressEditModal';

// Pages
export { default as CartPage } from './pages/CartPage';
export { default as CheckoutPage } from './pages/CheckoutPage';

// Services
export { createOrder, fetchOrders, fetchOrderById, checkStockAvailability } from './services/orderService';

// Schemas
export { CartItemSchema, CartItemsSchema } from './schemas/cartSchema';
