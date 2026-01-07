import { Client, Manager, Dish, Order, OrderDetails, Product, ProductStock, OrderWithDetails } from '../types';

// --- Initial Data (from SQL Dump) ---

const INITIAL_CLIENTS: Client[] = [
  { client_id: 1, client_full_name: 'Смирнов Павел Александрович', phone_number: '9012345678' },
  { client_id: 2, client_full_name: 'Волкова Екатерина Олеговна', phone_number: '9023456789' },
  { client_id: 3, client_full_name: 'Николаев Иван Петрович', phone_number: '9034567890' },
  { client_id: 4, client_full_name: 'Орлова София Дмитриевна', phone_number: '9045678901' },
];

const INITIAL_MANAGERS: Manager[] = [
  { manager_id: 1, manager_full_name: 'Иванов Алексей Петрович' },
  { manager_id: 2, manager_full_name: 'Петрова Мария Сергеевна' },
  { manager_id: 3, manager_full_name: 'Сидоров Дмитрий Владимирович' },
  { manager_id: 4, manager_full_name: 'Козлова Анна Игоревна' },
];

const INITIAL_DISHES: Dish[] = [
  { dish_id: 1, dish_name: 'Салат Цезарь', cost_price: 180.50, sale_price: 450.00, price_category: 'Стандарт' },
  { dish_id: 2, dish_name: 'Тирамису', cost_price: 120.75, sale_price: 320.00, price_category: 'Стандарт' },
  { dish_id: 3, dish_name: 'Стейк из говядины', cost_price: 350.25, sale_price: 890.00, price_category: 'Премиум' },
  { dish_id: 4, dish_name: 'Картофель по-деревенски', cost_price: 85.30, sale_price: 220.00, price_category: 'Эконом' },
  { dish_id: 5, dish_name: 'Шоколадный мусс', cost_price: 95.60, sale_price: 280.00, price_category: 'Эконом' },
  { dish_id: 6, dish_name: 'Суп-пюре грибной', cost_price: 110.40, sale_price: 300.00, price_category: 'Стандарт' },
];

const INITIAL_ORDERS: Order[] = [
  { order_id: 1, status: 'Выполнен', manager_id: 1, client_id: 1, event_date: '2022-10-15', rental_cost: 5000.00 },
  { order_id: 2, status: 'Выполнен', manager_id: 2, client_id: 2, event_date: '2022-11-20', rental_cost: 7500.00 },
  { order_id: 3, status: 'Отменен', manager_id: 3, client_id: 3, event_date: '2023-01-10', rental_cost: 3000.00 },
  { order_id: 4, status: 'В процессе', manager_id: 4, client_id: 1, event_date: '2023-02-28', rental_cost: 6000.00 },
  { order_id: 5, status: 'Выполнен', manager_id: 1, client_id: 4, event_date: '2023-03-15', rental_cost: 4500.00 },
];

const INITIAL_ORDER_DETAILS: OrderDetails[] = [
  { dish_id: 1, order_id: 1, serving_number: 2 },
  { dish_id: 2, order_id: 1, serving_number: 3 },
  { dish_id: 3, order_id: 2, serving_number: 5 },
  { dish_id: 1, order_id: 4, serving_number: 10 },
];

// --- Service Class ---

class MockDatabase {
  private clients: Client[] = [...INITIAL_CLIENTS];
  private managers: Manager[] = [...INITIAL_MANAGERS];
  private dishes: Dish[] = [...INITIAL_DISHES];
  private orders: Order[] = [...INITIAL_ORDERS];
  private orderDetails: OrderDetails[] = [...INITIAL_ORDER_DETAILS];

  // Getters
  getClients() { return this.clients; }
  getManagers() { return this.managers; }
  getDishes() { return this.dishes; }
  
  getOrdersWithDetails(): OrderWithDetails[] {
    return this.orders.map(order => {
      const client = this.clients.find(c => c.client_id === order.client_id);
      const manager = this.managers.find(m => m.manager_id === order.manager_id);
      const details = this.orderDetails.filter(od => od.order_id === order.order_id);
      
      const items = details.map(d => {
        const dish = this.dishes.find(dish => dish.dish_id === d.dish_id);
        return {
          dish_name: dish?.dish_name || 'Unknown',
          quantity: d.serving_number,
          price: dish?.sale_price || 0
        };
      });

      return {
        ...order,
        client_name: client?.client_full_name || 'Unknown Client',
        manager_name: manager?.manager_full_name || 'Unknown Manager',
        items
      };
    }).sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
  }

  // Operations

  updateDish(updatedDish: Dish) {
    this.dishes = this.dishes.map(d => d.dish_id === updatedDish.dish_id ? updatedDish : d);
    // Recalculate price category
    const target = this.dishes.find(d => d.dish_id === updatedDish.dish_id);
    if(target) {
        if (target.sale_price < 300) target.price_category = 'Эконом';
        else if (target.sale_price <= 600) target.price_category = 'Стандарт';
        else target.price_category = 'Премиум';
    }
  }

  updateClient(updatedClient: Client) {
      this.clients = this.clients.map(c => c.client_id === updatedClient.client_id ? updatedClient : c);
  }

  addClient(newClient: Omit<Client, 'client_id'>) {
      const id = Math.max(...this.clients.map(c => c.client_id)) + 1;
      this.clients.push({ ...newClient, client_id: id });
  }

  createOrder(
    clientId: number,
    managerId: number,
    date: string,
    items: { dishId: number; quantity: number }[]
  ) {
    const orderId = Math.max(...this.orders.map(o => o.order_id), 0) + 1;
    let totalCost = 0;

    items.forEach(item => {
      const dish = this.dishes.find(d => d.dish_id === item.dishId);
      if (dish) {
        totalCost += dish.sale_price * item.quantity;
        this.orderDetails.push({
          order_id: orderId,
          dish_id: item.dishId,
          serving_number: item.quantity
        });
      }
    });

    const newOrder: Order = {
      order_id: orderId,
      client_id: clientId,
      manager_id: managerId,
      event_date: date,
      status: 'В обработке', // Default status from logic
      rental_cost: totalCost
    };

    this.orders.push(newOrder);
    return newOrder;
  }
}

export const db = new MockDatabase();
