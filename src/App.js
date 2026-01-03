import React, { useState, useEffect } from 'react';
import { Plus, Package, Users, DollarSign, Search, Edit2, Trash2, TrendingUp, Calendar } from 'lucide-react';
import axios from 'axios';

// 🔥 CHANGE THIS TO YOUR RENDER BACKEND URL
const API_URL = 'https://braminventory-backend.onrender.com/api';

export default function InventoryApp() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [loading, setLoading] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    paymentMethod: 'cash'
  });

  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [saleForm, setSaleForm] = useState({
    customerId: '',
    productId: '',
    quantity: '1',
    deliveryPrice: '',
    deliveryDate: '',
    paymentMethod: 'cash',
    status: 'pending'
  });

  const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Other'];
  const paymentMethods = ['cash', 'credit_card', 'debit_card', 'mobile_payment', 'bank_transfer'];
  const deliveryStatuses = ['pending', 'in_transit', 'delivered', 'cancelled'];

  // Load data from API on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, customersRes, salesRes] = await Promise.all([
        axios.get(`${API_URL}/products`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/customers`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/sales`).catch(() => ({ data: [] }))
      ]);

      setProducts(productsRes.data || []);
      setCustomers(customersRes.data || []);
      setSales(salesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading data. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (productForm.name && productForm.price) {
      try {
        const productData = { ...productForm, id: Date.now() };

        if (editingProduct !== null) {
          await axios.put(`${API_URL}/products/${products[editingProduct].id}`, productData);
          const updatedProducts = [...products];
          updatedProducts[editingProduct] = productData;
          setProducts(updatedProducts);
          setEditingProduct(null);
        } else {
          await axios.post(`${API_URL}/products`, productData);
          setProducts([...products, productData]);
        }

        setProductForm({ name: '', category: '', price: '', quantity: '', paymentMethod: 'cash' });
        setShowProductForm(false);
      } catch (error) {
        console.error('Error saving product:', error);
        alert('Error saving product. Please try again.');
      }
    }
  };

  const handleAddCustomer = async () => {
    if (customerForm.name) {
      try {
        const customerData = { ...customerForm, id: Date.now() };

        if (editingCustomer !== null) {
          await axios.put(`${API_URL}/customers/${customers[editingCustomer].id}`, customerData);
          const updatedCustomers = [...customers];
          updatedCustomers[editingCustomer] = customerData;
          setCustomers(updatedCustomers);
          setEditingCustomer(null);
        } else {
          await axios.post(`${API_URL}/customers`, customerData);
          setCustomers([...customers, customerData]);
        }

        setCustomerForm({ name: '', email: '', phone: '', address: '' });
        setShowCustomerForm(false);
      } catch (error) {
        console.error('Error saving customer:', error);
        alert('Error saving customer. Please try again.');
      }
    }
  };

  const handleAddSale = async () => {
    if (saleForm.customerId && saleForm.productId && saleForm.deliveryDate) {
      try {
        const product = products.find(p => p.id === parseInt(saleForm.productId));
        const productPrice = parseFloat(product.price) * parseInt(saleForm.quantity);
        const deliveryPrice = parseFloat(saleForm.deliveryPrice) || 0;
        const totalRevenue = productPrice + deliveryPrice;

        const saleData = {
          ...saleForm,
          id: Date.now(),
          productPrice,
          deliveryPrice,
          totalRevenue,
          createdAt: new Date().toISOString()
        };

        if (editingSale !== null) {
          saleData.id = sales[editingSale].id;
          await axios.put(`${API_URL}/sales/${sales[editingSale].id}`, saleData);
          const updatedSales = [...sales];
          updatedSales[editingSale] = saleData;
          setSales(updatedSales);
          setEditingSale(null);
        } else {
          await axios.post(`${API_URL}/sales`, saleData);
          setSales([...sales, saleData]);
        }

        setSaleForm({
          customerId: '',
          productId: '',
          quantity: '1',
          deliveryPrice: '',
          deliveryDate: '',
          paymentMethod: 'cash',
          status: 'pending'
        });
        setShowSaleForm(false);
      } catch (error) {
        console.error('Error saving sale:', error);
        alert('Error saving sale. Please try again.');
      }
    }
  };

  const handleEditProduct = (index) => {
    setProductForm(products[index]);
    setEditingProduct(index);
    setShowProductForm(true);
  };

  const handleEditCustomer = (index) => {
    setCustomerForm(customers[index]);
    setEditingCustomer(index);
    setShowCustomerForm(true);
  };

  const handleEditSale = (index) => {
    setSaleForm({
      customerId: sales[index].customerId.toString(),
      productId: sales[index].productId.toString(),
      quantity: sales[index].quantity.toString(),
      deliveryPrice: sales[index].deliveryPrice.toString(),
      deliveryDate: sales[index].deliveryDate,
      paymentMethod: sales[index].paymentMethod,
      status: sales[index].status
    });
    setEditingSale(index);
    setShowSaleForm(true);
  };

  const handleDeleteProduct = async (index) => {
    try {
      await axios.delete(`${API_URL}/products/${products[index].id}`);
      const updatedProducts = products.filter((_, i) => i !== index);
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product. Please try again.');
    }
  };

  const handleDeleteCustomer = async (index) => {
    try {
      await axios.delete(`${API_URL}/customers/${customers[index].id}`);
      const updatedCustomers = customers.filter((_, i) => i !== index);
      setCustomers(updatedCustomers);
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error deleting customer. Please try again.');
    }
  };

  const handleDeleteSale = async (index) => {
    try {
      await axios.delete(`${API_URL}/sales/${sales[index].id}`);
      const updatedSales = sales.filter((_, i) => i !== index);
      setSales(updatedSales);
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Error deleting sale. Please try again.');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSales = sales.filter(s => {
    const customer = customers.find(c => c.id === parseInt(s.customerId));
    const product = products.find(p => p.id === parseInt(s.productId));
    return (customer?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (product?.name.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const totalInventoryValue = products.reduce((sum, p) => sum + (parseFloat(p.price) * (parseInt(p.quantity) || 1)), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalRevenue, 0);
  const pendingDeliveries = sales.filter(s => s.status === 'pending' || s.status === 'in_transit').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold">Inventory Manager</h1>
        <p className="text-blue-100 text-sm">Manage products, customers & deliveries</p>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs">Products</p>
              <p className="text-xl font-bold text-gray-800">{products.length}</p>
            </div>
            <Package className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs">Customers</p>
              <p className="text-xl font-bold text-gray-800">{customers.length}</p>
            </div>
            <Users className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs">Revenue</p>
              <p className="text-xl font-bold text-gray-800">${totalRevenue.toFixed(2)}</p>
            </div>
            <TrendingUp className="text-purple-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs">Pending</p>
              <p className="text-xl font-bold text-gray-800">{pendingDeliveries}</p>
            </div>
            <Calendar className="text-orange-500" size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="flex gap-2 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'products' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'customers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'sales' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Sales & Delivery
          </button>
        </div>
      </div>

      {/* Search and Add Button */}
      <div className="p-4 flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => {
            if (activeTab === 'products') setShowProductForm(true);
            else if (activeTab === 'customers') setShowCustomerForm(true);
            else setShowSaleForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Add
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="p-4">
          {showProductForm && (
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <h3 className="text-lg font-semibold mb-4">{editingProduct !== null ? 'Edit Product' : 'Add New Product'}</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Price"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Quantity in Stock"
                  value={productForm.quantity}
                  onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddProduct}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingProduct !== null ? 'Update' : 'Add'} Product
                  </button>
                  <button
                    onClick={() => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                      setProductForm({ name: '', category: '', price: '', quantity: '', paymentMethod: 'cash' });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredProducts.map((product, index) => (
              <div key={product.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        ${product.price}
                      </span>
                      {product.quantity && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          Stock: {product.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProduct(index)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No products found. Add your first product!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="p-4">
          {showCustomerForm && (
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <h3 className="text-lg font-semibold mb-4">{editingCustomer !== null ? 'Edit Customer' : 'Add New Customer'}</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Address"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCustomer}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingCustomer !== null ? 'Update' : 'Add'} Customer
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomerForm(false);
                      setEditingCustomer(null);
                      setCustomerForm({ name: '', email: '', phone: '', address: '' });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredCustomers.map((customer, index) => (
              <div key={customer.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{customer.name}</h3>
                    {customer.email && (
                      <p className="text-sm text-gray-600 mt-1">{customer.email}</p>
                    )}
                    {customer.phone && (
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                    )}
                    {customer.address && (
                      <p className="text-sm text-gray-500 mt-2">{customer.address}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCustomer(index)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredCustomers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No customers found. Add your first customer!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sales & Delivery Tab */}
      {activeTab === 'sales' && (
        <div className="p-4">
          {showSaleForm && (
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <h3 className="text-lg font-semibold mb-4">{editingSale !== null ? 'Edit Sale' : 'Add New Sale'}</h3>
              <div className="space-y-3">
                <select
                  value={saleForm.customerId}
                  onChange={(e) => setSaleForm({ ...saleForm, customerId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
                <select
                  value={saleForm.productId}
                  onChange={(e) => setSaleForm({ ...saleForm, productId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name} - ${product.price}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Quantity"
                  value={saleForm.quantity}
                  onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Delivery Price"
                  value={saleForm.deliveryPrice}
                  onChange={(e) => setSaleForm({ ...saleForm, deliveryPrice: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={saleForm.deliveryDate}
                  onChange={(e) => setSaleForm({ ...saleForm, deliveryDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={saleForm.paymentMethod}
                  onChange={(e) => setSaleForm({ ...saleForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Payment Method</option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>
                      {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                <select
                  value={saleForm.status}
                  onChange={(e) => setSaleForm({ ...saleForm, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {deliveryStatuses.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSale}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingSale !== null ? 'Update' : 'Add'} Sale
                  </button>
                  <button
                    onClick={() => {
                      setShowSaleForm(false);
                      setEditingSale(null);
                      setSaleForm({
                        customerId: '',
                        productId: '',
                        quantity: '1',
                        deliveryPrice: '',
                        deliveryDate: '',
                        paymentMethod: 'cash',
                        status: 'pending'
                      });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredSales.map((sale, index) => {
              const customer = customers.find(c => c.id === parseInt(sale.customerId));
              const product = products.find(p => p.id === parseInt(sale.productId));
              const statusColors = {
                pending: 'bg-yellow-100 text-yellow-800',
                in_transit: 'bg-blue-100 text-blue-800',
                delivered: 'bg-green-100 text-green-800',
                cancelled: 'bg-red-100 text-red-800'
              };
              return (
                <div key={sale.id} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{customer?.name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-600">{product?.name || 'Unknown'} (x{sale.quantity})</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-500">
                          Product: ${sale.productPrice.toFixed(2)} | Delivery: ${sale.deliveryPrice.toFixed(2)}
                        </p>
                        <p className="text-sm font-semibold text-gray-700">
                          Total Revenue: ${sale.totalRevenue.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">