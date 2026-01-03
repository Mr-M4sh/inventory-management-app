import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Menu, X, Home, Package, Users, ShoppingCart, Trash2, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';

const API_URL = 'https://braminventory-backend.onrender.com/api';

function App() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', address: '' });
  const [form, setForm] = useState({ name: '', category: '', price: '', quantity: '', cost: '' });
  const [activeView, setActiveView] = useState('dashboard');
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderForm, setOrderForm] = useState({ customerId: '', productId: '', quantity: 1, deliveryPrice: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchSales();
    fetchCustomers();
    console.log('App mounted');

    // Auto-refresh data every 3 seconds to keep dashboard updated
    const interval = setInterval(() => {
      fetchSales();
      fetchProducts();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data || []);
    } catch (err) {
      console.error('Error fetching products', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await axios.get(`${API_URL}/sales`);
      setSales(res.data || []);
    } catch (err) {
      console.error('Error fetching sales', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_URL}/customers`);
      setCustomers(res.data || []);
    } catch (err) {
      console.error('Error fetching customers', err);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    try {
      const payload = { ...form, price: parseFloat(form.price), cost: parseFloat(form.cost) || 0, quantity: parseInt(form.quantity) || 0 };
      const res = await axios.post(`${API_URL}/products`, payload);
      setProducts(prev => [...prev, res.data || payload]);
      setForm({ name: '', category: '', price: '', quantity: '', cost: '' });
    } catch (err) {
      console.error('Error adding product', err);
      alert('Failed to add product. Check console for details.');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    // Find matching product to resolve possible _id vs id differences
    const prod = products.find(p => String(p.id) === String(id) || String(p._id) === String(id));
    const targetId = prod ? (prod._id || prod.id) : id;
    try {
      await axios.delete(`${API_URL}/products/${targetId}`);
      setProducts(prev => prev.filter(p => String(p.id) !== String(targetId) && String(p._id) !== String(targetId)));
    } catch (err) {
      console.error('Error deleting product', err);
      // fallback: remove locally if server delete fails to keep UI responsive
      setProducts(prev => prev.filter(p => String(p.id) !== String(id) && String(p._id) !== String(id)));
      alert('Delete request failed — removed locally. Check console for details.');
    }
  };

  const addCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.name) return;
    try {
      const payload = { ...customerForm };
      const res = await axios.post(`${API_URL}/customers`, payload);
      setCustomers(prev => [...prev, res.data || payload]);
      setCustomerForm({ name: '', phone: '', address: '' });
    } catch (err) {
      console.error('Error adding customer', err);
      alert('Failed to add customer.');
    }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    const cust = customers.find(c => String(c.id) === String(id) || String(c._id) === String(id));
    const targetId = cust ? (cust._id || cust.id) : id;
    try {
      await axios.delete(`${API_URL}/customers/${targetId}`);
      setCustomers(prev => prev.filter(c => String(c.id) !== String(targetId) && String(c._id) !== String(targetId)));
    } catch (err) {
      console.error('Error deleting customer', err);
      setCustomers(prev => prev.filter(c => String(c.id) !== String(id) && String(c._id) !== String(id)));
      alert('Delete request failed — removed locally.');
    }
  };

  const createOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.customerId || !orderForm.productId || !orderForm.quantity) return;
    const product = products.find(p => String(p.id) === String(orderForm.productId) || String(p._id) === String(orderForm.productId));
    if (!product) {
      alert('Selected product not found');
      return;
    }
    const qty = parseInt(orderForm.quantity) || 1;
    if (qty > (Number(product.quantity) || 0)) {
      alert('Insufficient stock');
      return;
    }
    const productPrice = Number(product.price || 0) * qty;
    const deliveryPrice = Number(orderForm.deliveryPrice) || 0;
    const totalRevenue = productPrice + deliveryPrice;

    const saleData = {
      customerId: orderForm.customerId,
      productId: orderForm.productId,
      quantity: qty,
      productPrice,
      deliveryPrice,
      totalRevenue,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      const saleRes = await axios.post(`${API_URL}/sales`, saleData);
      const savedSale = saleRes.data || saleData;
      setSales(prev => [...prev, savedSale]);

      const targetId = product._id || product.id;
      const newQty = Math.max(0, (Number(product.quantity) || 0) - qty);
      const updatedProduct = { ...product, quantity: newQty };
      await axios.put(`${API_URL}/products/${targetId}`, updatedProduct).catch(() => {});
      setProducts(prev => prev.map(p => (String(p.id) === String(product.id) || String(p._id) === String(product._id)) ? updatedProduct : p));

      setOrderForm({ customerId: '', productId: '', quantity: 1, deliveryPrice: 0 });
      
      // Refresh data after successful order creation
      setTimeout(() => {
        fetchSales();
        fetchProducts();
      }, 300);
    } catch (err) {
      console.error('Error creating order', err);
      alert('Failed to create order. Check console for details.');
    }
  };

  const updateOrderStatus = async (saleId, newStatus) => {
    const sale = sales.find(s => String(s.id || s._id) === String(saleId));
    if (!sale) return;
    try {
      const updated = { ...sale, status: newStatus };
      await axios.put(`${API_URL}/sales/${sale.id || sale._id}`, updated);
      if (newStatus === 'cancelled') {
        const prod = products.find(p => String(p.id) === String(sale.productId) || String(p._id) === String(sale.productId));
        if (prod) {
          const targetId = prod._id || prod.id;
          const newQty = (Number(prod.quantity) || 0) + Number(sale.quantity || 0);
          const updatedProd = { ...prod, quantity: newQty };
          await axios.put(`${API_URL}/products/${targetId}`, updatedProd).catch(() => {});
          setProducts(prev => prev.map(p => (String(p.id) === String(prod.id) || String(p._id) === String(prod._id)) ? updatedProd : p));
        }
      }
      setSales(prev => prev.map(s => (String(s.id || s._id) === String(saleId) ? updated : s)));
      
      // Refresh data after successful update
      setTimeout(() => {
        fetchSales();
        fetchProducts();
      }, 300);
    } catch (err) {
      console.error('Error updating order status', err);
      alert('Failed to update order status.');
    }
  };

  const deleteOrder = async (saleId) => {
    if (!window.confirm('Delete this order?')) return;
    const sale = sales.find(s => String(s.id || s._id) === String(saleId));
    if (!sale) return;
    try {
      await axios.delete(`${API_URL}/sales/${sale.id || sale._id}`);
      // Restore stock if not cancelled
      if (sale.status !== 'cancelled') {
        const prod = products.find(p => String(p.id) === String(sale.productId) || String(p._id) === String(sale.productId));
        if (prod) {
          const targetId = prod._id || prod.id;
          const newQty = (Number(prod.quantity) || 0) + Number(sale.quantity || 0);
          const updatedProd = { ...prod, quantity: newQty };
          await axios.put(`${API_URL}/products/${targetId}`, updatedProd).catch(() => {});
          setProducts(prev => prev.map(p => (String(p.id) === String(prod.id) || String(p._id) === String(prod._id)) ? updatedProd : p));
        }
      }
      setSales(prev => prev.filter(s => String(s.id || s._id) !== String(saleId)));
      
      // Refresh data after successful deletion
      setTimeout(() => {
        fetchSales();
        fetchProducts();
      }, 300);
    } catch (err) {
      console.error('Error deleting order', err);
      alert('Failed to delete order.');
    }
  };

  const startEditOrder = (sale) => {
    setEditingOrder({
      id: sale.id || sale._id,
      quantity: sale.quantity,
      deliveryPrice: sale.deliveryPrice || 0
    });
  };

  const saveEditedOrder = async () => {
    if (!editingOrder) return;
    const sale = sales.find(s => String(s.id || s._id) === String(editingOrder.id));
    if (!sale) return;

    try {
      // Calculate stock delta
      const quantityDelta = Number(sale.quantity) - Number(editingOrder.quantity);
      const prod = products.find(p => String(p.id) === String(sale.productId) || String(p._id) === String(sale.productId));
      
      if (prod && quantityDelta !== 0) {
        const targetId = prod._id || prod.id;
        const newQty = Math.max(0, (Number(prod.quantity) || 0) + quantityDelta);
        const updatedProd = { ...prod, quantity: newQty };
        await axios.put(`${API_URL}/products/${targetId}`, updatedProd).catch(() => {});
        setProducts(prev => prev.map(p => (String(p.id) === String(prod.id) || String(p._id) === String(prod._id)) ? updatedProd : p));
      }

      // Update sale with all required fields
      const productPrice = Number(sale.productPrice || 0) / Number(sale.quantity) * Number(editingOrder.quantity);
      const updatedSale = {
        ...sale,
        quantity: Number(editingOrder.quantity),
        deliveryPrice: Number(editingOrder.deliveryPrice),
        productPrice: productPrice,
        totalRevenue: productPrice + Number(editingOrder.deliveryPrice),
        status: sale.status,
        customerId: sale.customerId,
        productId: sale.productId
      };
      
      const saleId = sale.id || sale._id;
      await axios.put(`${API_URL}/sales/${saleId}`, updatedSale);
      setSales(prev => prev.map(s => (String(s.id || s._id) === String(editingOrder.id) ? updatedSale : s)));
      setEditingOrder(null);
      
      // Refresh data after successful update
      setTimeout(() => {
        fetchSales();
        fetchProducts();
      }, 500);
    } catch (err) {
      console.error('Error saving edited order', err);
      alert('Failed to save edited order. Check console for details.');
    }
  };

  // CALCULATIONS
  const totalCost = products.reduce((sum, p) => sum + (Number(p.cost || 0) * (Number(p.quantity) || 0)), 0);
  const totalSalesRevenue = sales.filter(s => s.status === 'done').reduce((sum, s) => sum + (Number(s.productPrice) || 0), 0);
  const totalDeliveryRevenue = sales.filter(s => s.status === 'done').reduce((sum, s) => sum + (Number(s.deliveryPrice) || 0), 0);
  const totalRevenue = totalSalesRevenue + totalDeliveryRevenue;
  const profit = totalRevenue - totalCost;
  const productsSold = sales.filter(s => s.status === 'done').length;
  const pendingOrders = sales.filter(s => s.status === 'pending').length;
  const cancelledOrders = sales.filter(s => s.status === 'cancelled').length;

  // VIEW FUNCTIONS
  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm">Revenue</p>
              <p className="text-3xl font-bold mt-2">${totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign size={40} className="opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm">Sales Revenue</p>
              <p className="text-3xl font-bold mt-2">${totalSalesRevenue.toFixed(2)}</p>
            </div>
            <TrendingUp size={40} className="opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-orange-100 text-sm">Delivery Revenue</p>
              <p className="text-3xl font-bold mt-2">${totalDeliveryRevenue.toFixed(2)}</p>
            </div>
            <BarChart3 size={40} className="opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-100 text-sm">Amount Invested</p>
              <p className="text-3xl font-bold mt-2">${totalCost.toFixed(2)}</p>
            </div>
            <Package size={40} className="opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-100 text-sm">Profit</p>
              <p className={`text-3xl font-bold mt-2 ${profit < 0 ? 'text-red-200' : ''}`}>${profit.toFixed(2)}</p>
            </div>
            <TrendingUp size={40} className="opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
          <div>
            <p className="text-indigo-100 text-sm">Key Metrics</p>
            <div className="mt-4 space-y-2">
              <p className="text-lg"><strong>{products.length}</strong> Products</p>
              <p className="text-lg"><strong>{customers.length}</strong> Customers</p>
              <p className="text-lg"><strong>{productsSold}</strong> Sold</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Products</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
        <form onSubmit={addProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product Name" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Category" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Selling Price" type="number" step="0.01" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="Cost / Investment" type="number" step="0.01" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="Quantity" type="number" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Add</button>
            <button type="button" onClick={() => setForm({ name: '', category: '', price: '', quantity: '', cost: '' })} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Clear</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Products List</h3>
        </div>
        {loading ? (
          <p className="p-6 text-gray-600">Loading...</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-gray-600">No products yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cost</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id || p._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">{p.name}</td>
                    <td className="px-6 py-3">{p.category || '-'}</td>
                    <td className="px-6 py-3">${Number(p.price).toFixed(2)}</td>
                    <td className="px-6 py-3">${Number(p.cost || 0).toFixed(2)}</td>
                    <td className="px-6 py-3"><span className={`px-3 py-1 rounded-full text-sm font-semibold ${Number(p.quantity) > 5 ? 'bg-green-100 text-green-800' : Number(p.quantity) > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{p.quantity || 0}</span></td>
                    <td className="px-6 py-3 flex gap-2">
                      <button onClick={() => deleteProduct(p.id || p._id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Orders</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Create New Order</h3>
        <form onSubmit={createOrder} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <select value={orderForm.customerId} onChange={e => setOrderForm({ ...orderForm, customerId: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Customer</option>
            {customers.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
          </select>
          <select value={orderForm.productId} onChange={e => setOrderForm({ ...orderForm, productId: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Product</option>
            {products.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.name} (${Number(p.price).toFixed(2)})</option>)}
          </select>
          <input type="number" min="1" value={orderForm.quantity} onChange={e => setOrderForm({ ...orderForm, quantity: e.target.value })} placeholder="Qty" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="number" min="0" step="0.01" value={orderForm.deliveryPrice} onChange={e => setOrderForm({ ...orderForm, deliveryPrice: e.target.value })} placeholder="Delivery Charge" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="lg:col-span-1 md:col-span-2 col-span-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">Place Order</button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b bg-blue-50">
            <h3 className="text-lg font-semibold">Pending Orders ({pendingOrders})</h3>
          </div>
          {sales.filter(s => s.status === 'pending').length === 0 ? (
            <p className="p-6 text-gray-600">No pending orders.</p>
          ) : (
            <div className="divide-y">
              {sales.filter(s => s.status === 'pending').map(s => {
                const cust = customers.find(c => String(c.id) === String(s.customerId) || String(c._id) === String(s.customerId));
                const prod = products.find(p => String(p.id) === String(s.productId) || String(p._id) === String(s.productId));
                const isEditing = editingOrder && editingOrder.id === (s.id || s._id);
                
                return (
                  <div key={s.id || s._id} className="p-4 border-b hover:bg-gray-50">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="number"
                          min="1"
                          value={editingOrder.quantity}
                          onChange={e => setEditingOrder({ ...editingOrder, quantity: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 border rounded"
                          placeholder="Quantity"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingOrder.deliveryPrice}
                          onChange={e => setEditingOrder({ ...editingOrder, deliveryPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded"
                          placeholder="Delivery Price"
                        />
                        <div className="flex gap-2">
                          <button onClick={saveEditedOrder} className="flex-1 bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700">Save</button>
                          <button onClick={() => setEditingOrder(null)} className="flex-1 bg-gray-400 text-white text-sm px-3 py-1 rounded hover:bg-gray-500">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold">{cust?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{prod?.name || 'Unknown'} × {s.quantity}</p>
                        <p className="text-sm font-semibold mt-2">Sales: ${Number(s.productPrice).toFixed(2)} | Delivery: ${Number(s.deliveryPrice).toFixed(2)}</p>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => updateOrderStatus(s.id || s._id, 'done')} className="flex-1 bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700 transition">Done</button>
                          <button onClick={() => startEditOrder(s)} className="flex-1 bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 transition">Edit</button>
                          <button onClick={() => updateOrderStatus(s.id || s._id, 'cancelled')} className="flex-1 bg-red-600 text-white text-sm px-3 py-1 rounded hover:bg-red-700 transition">Cancel</button>
                          <button onClick={() => deleteOrder(s.id || s._id)} className="bg-red-800 text-white text-sm px-3 py-1 rounded hover:bg-red-900"><Trash2 size={16} /></button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b bg-green-50">
            <h3 className="text-lg font-semibold">Completed Orders ({productsSold})</h3>
          </div>
          {sales.filter(s => s.status === 'done').length === 0 ? (
            <p className="p-6 text-gray-600">No completed orders.</p>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {sales.filter(s => s.status === 'done').map(s => {
                const cust = customers.find(c => String(c.id) === String(s.customerId) || String(c._id) === String(s.customerId));
                const prod = products.find(p => String(p.id) === String(s.productId) || String(p._id) === String(s.productId));
                return (
                  <div key={s.id || s._id} className="p-4 flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{cust?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{prod?.name || 'Unknown'} × {s.quantity}</p>
                      <p className="text-sm text-green-600 font-semibold">Total: ${Number(s.totalRevenue || (s.productPrice + s.deliveryPrice)).toFixed(2)}</p>
                    </div>
                    <button onClick={() => deleteOrder(s.id || s._id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {cancelledOrders > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b bg-red-50">
            <h3 className="text-lg font-semibold">Cancelled Orders ({cancelledOrders})</h3>
          </div>
          <div className="divide-y max-h-64 overflow-y-auto">
            {sales.filter(s => s.status === 'cancelled').map(s => {
              const cust = customers.find(c => String(c.id) === String(s.customerId) || String(c._id) === String(s.customerId));
              const prod = products.find(p => String(p.id) === String(s.productId) || String(p._id) === String(s.productId));
              return (
                <div key={s.id || s._id} className="p-4">
                  <p className="font-semibold">{cust?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{prod?.name || 'Unknown'} × {s.quantity}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Customers</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Add New Customer</h3>
        <form onSubmit={addCustomer} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} placeholder="Customer Name" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder="Phone Number" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} placeholder="Address" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="md:col-span-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Add Customer</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.length === 0 ? (
          <p className="col-span-full text-gray-600">No customers yet.</p>
        ) : (
          customers.map(c => (
            <div key={c.id || c._id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold">{c.name}</h4>
                  <p className="text-sm text-gray-600 mt-2">{c.phone || 'No phone'}</p>
                  <p className="text-sm text-gray-600">{c.address || 'No address'}</p>
                </div>
                <button onClick={() => deleteCustomer(c.id || c._id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-indigo-700 to-indigo-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">Bramanda</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-indigo-600 rounded">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 space-y-2 p-4">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'customers', label: 'Customers', icon: Users }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeView === id ? 'bg-indigo-600' : 'hover:bg-indigo-600'
              }`}
            >
              <Icon size={20} />
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Bramanda Vape Management</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome back!</span>
          </div>
        </header>
        <main className="flex-1 p-8">
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'products' && renderProducts()}
          {activeView === 'orders' && renderOrders()}
          {activeView === 'customers' && renderCustomers()}
        </main>
      </div>
    </div>
  );
}

export default App;

