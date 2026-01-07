import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { ViewState, OrderWithDetails, Dish, Client, Manager } from './types';
import { api } from './services/api'; 
import { Modal, Button, InputGroup, Table, StatusBadge } from './components/UI';
import { Plus, Edit2, Search, Filter, Calendar, FileText, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- Sub-components for specific pages ---

// 1. ORDERS PAGE
const OrdersView: React.FC<{ 
  orders: OrderWithDetails[], 
  refreshOrders: () => void 
}> = ({ orders, refreshOrders }) => {
  // --- ВОССТАНОВЛЕННЫЕ СТЕЙТЫ ---
  const [filterText, setFilterText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Данные формы
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDishes, setSelectedDishes] = useState<{id: number, qty: number}[]>([]);
  
  // Данные справочников
  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);

  // Загрузка справочников
  useEffect(() => {
    api.getClients().then(setClients);
    api.getManagers().then(setManagers);
    api.getDishes().then(setDishes);
  }, []);

  // --- ЛОГИКА ФИЛЬТРАЦИИ (БЫЛА ПРОПУЩЕНА) ---
  const filteredOrders = orders.filter(o => 
    o.client_name.toLowerCase().includes(filterText.toLowerCase()) ||
    o.manager_name.toLowerCase().includes(filterText.toLowerCase()) ||
    o.status.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleAddDish = () => {
    if (dishes.length > 0) {
        setSelectedDishes([...selectedDishes, { id: dishes[0].dish_id, qty: 1 }]);
    }
  };

  const updateDishRow = (idx: number, field: 'id' | 'qty', value: number) => {
    const newDishes = [...selectedDishes];
    if (field === 'id') newDishes[idx].id = value;
    else newDishes[idx].qty = value;
    setSelectedDishes(newDishes);
  };

  const calculateTotal = () => {
    return selectedDishes.reduce((acc, item) => {
      const d = dishes.find(dish => dish.dish_id === item.id);
      return acc + (d ? d.sale_price * item.qty : 0);
    }, 0);
  };

  const handleSubmit = async () => {
    if(!selectedClient || !selectedManager) return alert("Выберите клиента и менеджера");
    try {
        await api.createOrder({
            client_id: Number(selectedClient),
            manager_id: Number(selectedManager),
            event_date: orderDate,
            items: selectedDishes.map(d => ({ dish_id: d.id, quantity: d.qty }))
        });
        setIsModalOpen(false);
        setSelectedDishes([]);
        refreshOrders(); 
        alert("Заказ успешно создан!");
    } catch (e: any) {
        alert("Ошибка создания заказа: " + e.message);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Список заказов</h2>
          <p className="text-slate-500">Управление банкетами и мероприятиями</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={18} /> Создать заказ
        </Button>
      </div>

      <div className="flex gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Поиск по клиенту, менеджеру или статусу..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-slate-500 px-4 bg-slate-50 rounded-lg border border-slate-200">
            <Filter size={16} />
            <span className="text-sm font-medium">Фильтр</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Table 
          data={filteredOrders}
          columns={[
            { header: 'ID', accessor: 'order_id', width: 'w-16' },
            { header: 'Статус', accessor: (row) => <StatusBadge status={row.status} /> },
            { header: 'Дата', accessor: (row) => new Date(row.event_date).toLocaleDateString() },
            { header: 'Клиент', accessor: 'client_name' },
            { header: 'Менеджер', accessor: 'manager_name' },
            { header: 'Сумма', accessor: (row) => <span className="font-semibold text-slate-700">{row.rental_cost.toLocaleString()} ₽</span> },
          ]}
        />
      </div>

      {/* CREATE ORDER MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Новый заказ">
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <InputGroup label="Клиент">
                <select className="w-full p-2.5 rounded-lg border border-slate-300 bg-white" 
                        value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
                    <option value="">Выберите клиента...</option>
                    {clients.map(c => <option key={c.client_id} value={c.client_id}>{c.client_full_name}</option>)}
                </select>
             </InputGroup>
             <InputGroup label="Менеджер">
                <select className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                        value={selectedManager} onChange={e => setSelectedManager(e.target.value)}>
                    <option value="">Выберите менеджера...</option>
                    {managers.map(m => <option key={m.manager_id} value={m.manager_id}>{m.manager_full_name}</option>)}
                </select>
             </InputGroup>
             <InputGroup label="Дата мероприятия">
                <input type="date" className="w-full p-2.5 rounded-lg border border-slate-300"
                       value={orderDate} onChange={e => setOrderDate(e.target.value)} />
             </InputGroup>
           </div>
           
           <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-slate-700">Состав заказа</h4>
                  <Button variant="secondary" onClick={handleAddDish} size="sm" className="text-xs">+ Добавить блюдо</Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {selectedDishes.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                          <select 
                            className="flex-1 p-2 border border-slate-300 rounded text-sm"
                            value={item.id}
                            onChange={(e) => updateDishRow(idx, 'id', Number(e.target.value))}
                          >
                             {dishes.map(d => <option key={d.dish_id} value={d.dish_id}>{d.dish_name} ({d.sale_price}₽)</option>)}
                          </select>
                          <input 
                            type="number" min="1" 
                            className="w-20 p-2 border border-slate-300 rounded text-sm"
                            value={item.qty}
                            onChange={(e) => updateDishRow(idx, 'qty', Number(e.target.value))}
                          />
                          <button 
                            onClick={() => { const n = [...selectedDishes]; n.splice(idx, 1); setSelectedDishes(n); }}
                            className="text-red-500 hover:text-red-700 px-2"
                          >
                              <XIcon size={16} />
                          </button>
                      </div>
                  ))}
                  {selectedDishes.length === 0 && <p className="text-sm text-slate-400 italic">Нет блюд</p>}
              </div>
              <div className="mt-4 flex justify-end items-center gap-4 bg-slate-50 p-4 rounded-lg">
                  <span className="text-slate-500">Итоговая стоимость:</span>
                  <span className="text-2xl font-bold text-slate-800">{calculateTotal().toLocaleString()} ₽</span>
              </div>
           </div>

           <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Отмена</Button>
              <Button onClick={handleSubmit}>Сформировать заказ</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

const XIcon = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

// 2. MENU PAGE (Inline Editing)
const MenuView: React.FC = () => {
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Состояния для редактирования
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<Dish>>({});

    // Функция загрузки данных с сервера
    const loadDishes = async () => {
        try {
            setIsLoading(true);
            const data = await api.getDishes();
            setDishes(data);
        } catch (error) {
            console.error("Не удалось загрузить меню:", error);
            alert("Ошибка загрузки данных");
        } finally {
            setIsLoading(false);
        }
    };

    // Загружаем данные при первом рендере компонента
    useEffect(() => {
        loadDishes();
    }, []);

    const handleEdit = (dish: Dish) => {
        setEditingId(dish.dish_id);
        // Копируем текущие данные в форму редактирования
        setEditForm({ 
            cost_price: dish.cost_price, 
            sale_price: dish.sale_price 
        });
    };

    const handleSave = async () => {
        if (editingId && editForm.cost_price && editForm.sale_price) {
            try {
                // 1. Отправляем изменения на сервер
                await api.updateDish(editingId, {
                    cost_price: Number(editForm.cost_price),
                    sale_price: Number(editForm.sale_price)
                });
                
                // 2. Выходим из режима редактирования
                setEditingId(null);
                
                // 3. ОБЯЗАТЕЛЬНО: Перезагружаем список.
                // В базе данных сработает триггер, который может изменить 
                // price_category или profit. Нам нужно получить эти новые значения.
                await loadDishes(); 
                
            } catch (error) {
                console.error("Ошибка сохранения:", error);
                alert("Не удалось сохранить изменения");
            }
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Загрузка меню...</div>;
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Меню блюд</h2>
            <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-slate-200">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Название</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Себестоимость</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Цена продажи</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Категория</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase w-24">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {dishes.map(dish => {
                            const isEditing = editingId === dish.dish_id;
                            return (
                                <tr key={dish.dish_id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-700">{dish.dish_name}</td>
                                    
                                    {/* Колонка Себестоимость */}
                                    <td className="p-4 text-slate-600">
                                        {isEditing ? (
                                            <input 
                                                type="number" 
                                                className="w-24 p-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200" 
                                                value={editForm.cost_price} 
                                                onChange={e => setEditForm({...editForm, cost_price: Number(e.target.value)})} 
                                            />
                                        ) : `${dish.cost_price} ₽`}
                                    </td>

                                    {/* Колонка Цена продажи */}
                                    <td className="p-4 text-slate-800 font-semibold">
                                        {isEditing ? (
                                            <input 
                                                type="number" 
                                                className="w-24 p-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200" 
                                                value={editForm.sale_price} 
                                                onChange={e => setEditForm({...editForm, sale_price: Number(e.target.value)})} 
                                            />
                                        ) : `${dish.sale_price} ₽`}
                                    </td>

                                    {/* Колонка Категория (Вычисляется триггером в БД, мы ее не редактируем) */}
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-xs ${
                                            dish.price_category === 'Премиум' ? 'bg-purple-100 text-purple-700' : 
                                            dish.price_category === 'Эконом' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {dish.price_category || 'Не задано'}
                                        </span>
                                    </td>

                                    {/* Кнопки действий */}
                                    <td className="p-4">
                                        {isEditing ? (
                                            <div className="flex gap-2">
                                                <button onClick={handleSave} className="text-green-600 font-bold text-xs hover:underline bg-green-50 px-2 py-1 rounded">
                                                    Сохр.
                                                </button>
                                                <button onClick={handleCancel} className="text-red-500 text-xs hover:underline bg-red-50 px-2 py-1 rounded">
                                                    Отм.
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleEdit(dish)} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="text-xs text-slate-400 p-2">
                * Изменение цены запускает триггер в БД, который автоматически пересчитывает категорию цены.
            </div>
        </div>
    );
};

// 3. REPORTS VIEW
const ReportsView: React.FC<{ orders: OrderWithDetails[] }> = ({ orders }) => {
    const [year, setYear] = useState(new Date().getFullYear());
    
    // Prepare data for chart
    const monthlyData = useMemo(() => {
        const data = Array(12).fill(0).map((_, i) => ({ 
            name: new Date(0, i).toLocaleString('ru', { month: 'short' }), 
            Revenue: 0,
            Orders: 0 
        }));

        orders.forEach(o => {
            const d = new Date(o.event_date);
            if (d.getFullYear() === year && o.status !== 'Отменен') {
                data[d.getMonth()].Revenue += o.rental_cost;
                data[d.getMonth()].Orders += 1;
            }
        });
        return data;
    }, [orders, year]);

    const totalRevenue = monthlyData.reduce((acc, curr) => acc + curr.Revenue, 0);


    return (
        <div className="h-full overflow-y-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <h2 className="text-2xl font-bold text-slate-800">Финансовый отчет</h2>
                   <p className="text-slate-500">Аналитика доходов за {year} год</p>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="bg-white border border-slate-300 rounded-lg flex items-center px-3 py-2 gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        <select 
                            value={year} 
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="bg-transparent outline-none text-sm text-slate-700 font-medium"
                        >
                            <option value="2022">2022</option>
                            <option value="2023">2023</option>
                            <option value="2024">2024</option>
                        </select>
                    </div>
                    <Button variant="secondary" className="flex items-center gap-2">
                        <Download size={16} /> PDF Экспорт
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-200">
                    <p className="text-blue-100 font-medium text-sm mb-1">Общая выручка</p>
                    <p className="text-3xl font-bold">{totalRevenue.toLocaleString()} ₽</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <p className="text-slate-500 font-medium text-sm mb-1">Количество заказов</p>
                    <p className="text-3xl font-bold text-slate-800">{monthlyData.reduce((a,b) => a + b.Orders, 0)}</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <p className="text-slate-500 font-medium text-sm mb-1">Средний чек</p>
                    <p className="text-3xl font-bold text-slate-800">
                        {monthlyData.reduce((a,b) => a + b.Orders, 0) > 0 
                          ? Math.round(totalRevenue / monthlyData.reduce((a,b) => a + b.Orders, 0)).toLocaleString() 
                          : 0} ₽
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-96">
                <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                    <BarChart size={20} className="text-blue-500"/> Динамика выручки
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white'}} 
                            cursor={{fill: '#f1f5f9'}}
                        />
                        <Legend />
                        <Bar dataKey="Revenue" name="Выручка (₽)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// 4. CLIENTS VIEW (Modal Edit)
const ClientsView: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState({ name: '', phone: '' });

    // Загрузка
    const loadClients = async () => {
        const data = await api.getClients();
        setClients(data);
    };

    useEffect(() => { loadClients(); }, []);

    // Открытие модалки
    const openEdit = (client: Client) => {
        setEditingClient(client);
        setFormData({ name: client.client_full_name, phone: client.phone_number });
    };

    // Сохранение
    const handleSave = async () => {
        if(editingClient) {
            try {
                await api.updateClient(editingClient.client_id, {
                    client_full_name: formData.name,
                    phone_number: formData.phone
                });
                await loadClients(); // Обновляем таблицу
                setEditingClient(null);
            } catch (e) {
                alert("Ошибка сохранения клиента");
            }
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
             <h2 className="text-2xl font-bold text-slate-800">База клиентов</h2>
             <div className="flex-1 overflow-auto">
                 <Table 
                    data={clients}
                    columns={[
                        { header: 'ID', accessor: 'client_id', width: 'w-16' },
                        { header: 'ФИО', accessor: 'client_full_name' },
                        { header: 'Телефон', accessor: 'phone_number' },
                        { header: 'Действия', accessor: (row) => (
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
                                <Edit2 size={16} />
                            </Button>
                        )}
                    ]}
                 />
             </div>
             
             {/* Edit Client Modal */}
             <Modal isOpen={!!editingClient} onClose={() => setEditingClient(null)} title="Редактировать клиента">
                 <div className="space-y-4">
                     <InputGroup label="ФИО Клиента">
                         <input className="w-full p-2 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                     </InputGroup>
                     <InputGroup label="Телефон">
                         <input className="w-full p-2 border rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                     </InputGroup>
                     <div className="flex justify-end gap-2 pt-4">
                         <Button variant="secondary" onClick={() => setEditingClient(null)}>Отмена</Button>
                         <Button onClick={handleSave}>Сохранить</Button>
                     </div>
                 </div>
             </Modal>
        </div>
    );
};

// --- MAIN APP ---

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('ORDERS');
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  
  // Функция загрузки данных
  const fetchOrders = () => {
    api.getOrders()
       .then(data => setOrders(data))
       .catch(err => console.error(err));
  };

  // Первичная загрузка
  useEffect(() => {
    fetchOrders();
  }, []);

  // Логика переключения страниц
  const renderContent = () => {
    switch (view) {
      case 'DASHBOARD':
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="p-6 bg-blue-50 rounded-full">
                    <FileText size={64} className="text-blue-500" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800">Добро пожаловать в CateringPRO</h2>
                <p className="text-slate-500 max-w-md">
                    Выберите раздел в меню слева для начала работы. 
                    Основной бизнес-процесс "Создание сложного заказа" находится в разделе <b>Заказы</b>.
                </p>
                <Button onClick={() => setView('ORDERS')}>Перейти к заказам</Button>
            </div>
        );
      case 'ORDERS':
        return <OrdersView orders={orders} refreshOrders={fetchOrders} />;
      case 'MENU':
        return <MenuView />;
      case 'CLIENTS':
        return <ClientsView />;
      case 'REPORTS':
        // ВАЖНО: Передаем orders как пропс, чтобы отчет строился по реальным данным
        return <ReportsView orders={orders} />;
      default:
        return <div>Not Implemented</div>;
    }
  };

  return (
    <Layout currentView={view} onNavigate={setView}>
      {renderContent()}
    </Layout>
  );
};

export default App;
