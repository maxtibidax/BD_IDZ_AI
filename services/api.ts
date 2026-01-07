const API_URL = 'http://localhost:8000/api';

export const api = {
    async getClients() {
        const res = await fetch(`${API_URL}/clients`);
        return res.json();
    },

    async updateClient(id: number, data: { client_full_name: string, phone_number: string }) {
        await fetch(`${API_URL}/clients/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    async getManagers() {
        const res = await fetch(`${API_URL}/managers`);
        return res.json();
    },

    async getDishes() {
        const res = await fetch(`${API_URL}/dishes`);
        return res.json();
    },

    async updateDish(id: number, data: { cost_price: number, sale_price: number }) {
        await fetch(`${API_URL}/dishes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    async getOrders() {
        const res = await fetch(`${API_URL}/orders`);
        return res.json();
    },

    async createOrder(data: any) {
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail);
        }
        return res.json();
    }
};