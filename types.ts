export interface Client {
  client_id: number;
  client_full_name: string;
  phone_number: string;
}

export interface Manager {
  manager_id: number;
  manager_full_name: string;
}

export interface Dish {
  dish_id: number;
  dish_name: string;
  cost_price: number;
  sale_price: number;
  price_category?: string;
  profit?: number;
}

export interface Order {
  order_id: number;
  status: string;
  manager_id: number;
  client_id: number;
  event_date: string; // ISO Date string
  rental_cost: number;
}

export interface OrderDetails {
  dish_id: number;
  order_id: number;
  serving_number: number;
}

export interface Product {
  product_id: number;
  product_name: string;
}

export interface ProductStock {
  product_id: number;
  quantity: number;
  min_quantity: number;
  last_restock_date: string;
}

// Extended types for UI display (joining tables)
export interface OrderWithDetails extends Order {
  client_name: string;
  manager_name: string;
  items: Array<{
    dish_name: string;
    quantity: number;
    price: number;
  }>;
}

export type ViewState = 'DASHBOARD' | 'ORDERS' | 'MENU' | 'CLIENTS' | 'REPORTS';
