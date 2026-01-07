from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import date

# НАСТРОЙКИ ПОДКЛЮЧЕНИЯ К БД
DB_CONFIG = {
    "dbname": "restaurant_db",      # Имя твоей базы
    "user": "postgres",       # Твой логин (обычно postgres)
    "password": "1234",       # Твой пароль
    "host": "localhost",
    "port": "5432"
}

app = FastAPI()

# Разрешаем React-у (порт 3000 или 5173) стучаться к нам (порт 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Функция подключения
def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print("Database connection error:", e)
        raise HTTPException(status_code=500, detail="Database connection failed")

# --- Pydantic модели (для валидации входящих данных) ---
class OrderItem(BaseModel):
    dish_id: int
    quantity: float

class CreateOrderRequest(BaseModel):
    client_id: int
    manager_id: int
    event_date: str
    items: List[OrderItem]

class DishUpdate(BaseModel):
    cost_price: float
    sale_price: float

class ClientUpdate(BaseModel):
    client_full_name: str
    phone_number: str

# --- API ENDPOINTS ---

@app.get("/api/clients")
def get_clients():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM Client ORDER BY client_full_name")
    clients = cur.fetchall()
    conn.close()
    return clients

@app.put("/api/clients/{client_id}")
def update_client(client_id: int, client: ClientUpdate):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE Client 
        SET client_full_name = %s, phone_number = %s 
        WHERE client_id = %s
    """, (client.client_full_name, client.phone_number, client_id))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/api/managers")
def get_managers():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM Manager")
    managers = cur.fetchall()
    conn.close()
    return managers

@app.get("/api/dishes")
def get_dishes():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM Dish ORDER BY dish_name")
    dishes = cur.fetchall()
    conn.close()
    return dishes

@app.put("/api/dishes/{dish_id}")
def update_dish(dish_id: int, dish: DishUpdate):
    conn = get_db_connection()
    cur = conn.cursor()
    # Обновляем цены. Триггер в БД сам пересчитает profit и price_category!
    cur.execute("""
        UPDATE Dish 
        SET cost_price = %s, sale_price = %s 
        WHERE dish_id = %s
    """, (dish.cost_price, dish.sale_price, dish_id))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/api/orders")
def get_orders():
    conn = get_db_connection()
    cur = conn.cursor()
    # Хитрый запрос: собираем данные заказа + массив блюд (items) в один JSON прямо в SQL
    query = """
        SELECT 
            o.order_id, 
            o.status, 
            o.event_date, 
            o.rental_cost,
            c.client_full_name as client_name,
            m.manager_full_name as manager_name,
            COALESCE(
                json_agg(
                    json_build_object(
                        'dish_name', d.dish_name,
                        'quantity', od.serving_number,
                        'price', d.sale_price
                    )
                ) FILTER (WHERE d.dish_id IS NOT NULL), 
                '[]'
            ) as items
        FROM "Order" o
        JOIN Client c ON o.client_id = c.client_id
        JOIN Manager m ON o.manager_id = m.manager_id
        LEFT JOIN Order_Details od ON o.order_id = od.order_id
        LEFT JOIN Dish d ON od.dish_id = d.dish_id
        GROUP BY o.order_id, c.client_full_name, m.manager_full_name
        ORDER BY o.event_date DESC
    """
    cur.execute(query)
    orders = cur.fetchall()
    conn.close()
    return orders

@app.post("/api/orders")
def create_order(order: CreateOrderRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Преобразуем список блюд в JSON строку для передачи в процедуру
        dishes_json = json.dumps([item.dict() for item in order.items])
        
        # ВЫЗОВ ХРАНИМОЙ ПРОЦЕДУРЫ create_complex_order_full
        # Обрати внимание: CALL используется для процедур в Postgres 11+
        cur.execute("""
            CALL create_complex_order_full(%s, %s, %s, %s, NULL, NULL, NULL, NULL)
        """, (order.client_id, order.manager_id, order.event_date, dishes_json))
        
        # Процедура имеет OUT параметры, но через Python драйвер их сложнее получить напрямую из CALL.
        # Обычно проще просто выполнить процедуру и если нет ошибки - значит ОК.
        
        conn.commit()
        return {"status": "success", "message": "Заказ создан через сложную процедуру"}
    except Exception as e:
        conn.rollback()
        print(e)
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
