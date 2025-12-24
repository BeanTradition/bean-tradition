
import React, { useEffect, useState } from 'react';
import { getAllOrders, fetchProducts, deleteProduct as apiDeleteProduct } from '../services/api';
import { Order, Product } from '../types';

interface AdminDashboardProps {
    onBack: () => void;
    onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, onLogout }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ordersData, productsData] = await Promise.all([
                getAllOrders(),
                fetchProducts()
            ]);
            setOrders(ordersData);
            setProducts(productsData);
        } catch (error) {
            console.error(error);
            alert("Failed to load admin data");
        }
        setLoading(false);
    };

    const handleDeleteProduct = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await apiDeleteProduct(id);
            // Refresh
            setProducts(prev => prev.filter(p => p._id !== id && p.id !== id));
        } catch (error) {
            console.error(error);
            alert("Failed to delete product");
        }
    };

    if (loading) return <div className="text-center py-20">Loading Admin Dashboard...</div>;

    return (
        <div className="bg-gray-100 min-h-screen pt-56 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-coffee-900">Admin Dashboard</h1>
                    <div className="flex gap-4">
                        <button onClick={onLogout} className="text-red-600 hover:text-red-800 font-bold uppercase text-xs tracking-widest border border-red-200 px-4 py-2 rounded-full hover:bg-red-50 transition-colors">
                            Logout
                        </button>
                        <button onClick={onBack} className="text-coffee-600 hover:text-coffee-900 underline font-medium">
                            Exit to Shop
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-6 py-3 rounded-lg font-bold ${activeTab === 'orders' ? 'bg-coffee-900 text-white' : 'bg-white text-coffee-900'}`}
                    >
                        Orders ({orders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-6 py-3 rounded-lg font-bold ${activeTab === 'products' ? 'bg-coffee-900 text-white' : 'bg-white text-coffee-900'}`}
                    >
                        Products ({products.length})
                    </button>
                </div>

                {activeTab === 'orders' ? (
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-coffee-50 border-b">
                                <tr>
                                    <th className="p-4 font-bold text-coffee-900">Order ID</th>
                                    <th className="p-4 font-bold text-coffee-900">Date</th>
                                    <th className="p-4 font-bold text-coffee-900">Customer</th>
                                    <th className="p-4 font-bold text-coffee-900">Total</th>
                                    <th className="p-4 font-bold text-coffee-900">Items</th>
                                    <th className="p-4 font-bold text-coffee-900">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {orders.map(order => (
                                    <tr key={order.id || (order as any)._id} className="hover:bg-gray-50">
                                        <td className="p-4 font-mono text-xs">{order.id}</td>
                                        <td className="p-4 text-sm font-mono text-gray-600">
                                            {(() => {
                                                const dateStr = (order as any).created_at || order.date;
                                                if (!dateStr) return '-';
                                                const d = new Date(dateStr);
                                                const day = String(d.getDate()).padStart(2, '0');
                                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                                const year = String(d.getFullYear()).slice(-2);
                                                const hours = String(d.getHours()).padStart(2, '0');
                                                const minutes = String(d.getMinutes()).padStart(2, '0');
                                                return `${day}/${month}/${year} ${hours}:${minutes}`;
                                            })()}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold">{order.customer?.name || (order as any).user?.name || 'Guest'}</div>
                                            <div className="text-xs text-gray-500">{order.customer?.email || (order as any).user?.email}</div>
                                        </td>
                                        <td className="p-4 font-bold">₹{order.total || order.totalPrice}</td>
                                        <td className="p-4 text-sm">{order.items?.length || (order as any).orderItems?.length} items</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Add New Product Card Placeholder */}
                        <div className="border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center h-64 cursor-pointer hover:border-coffee-500 hover:bg-white transition-all group">
                            <div className="text-center">
                                <span className="text-4xl text-gray-300 group-hover:text-coffee-500">+</span>
                                <p className="text-gray-400 font-bold mt-2 group-hover:text-coffee-900">Add New Product</p>
                                <p className="text-xs text-red-400 mt-2">(Use SQL Seed for now)</p>
                            </div>
                        </div>

                        {products.map(product => (
                            <div key={product.id || product._id} className="bg-white rounded-xl shadow overflow-hidden flex flex-col">
                                <img src={product.image} alt={product.name} className="h-40 w-full object-cover" />
                                <div className="p-4 flex-grow">
                                    <h3 className="font-bold text-coffee-900">{product.name}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{product.category}</p>
                                    <button
                                        onClick={() => handleDeleteProduct(product.id || product._id!)}
                                        className="text-red-500 text-xs font-bold uppercase hover:underline"
                                    >
                                        Delete Product
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
