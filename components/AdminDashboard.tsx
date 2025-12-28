
import React, { useEffect, useState } from 'react';
import { getAllOrders, fetchProducts, deleteProduct as apiDeleteProduct, createProduct } from '../services/api';
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
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        image: '',
        category: 'Beans',
        roast: 'Medium',
        intensity: 3,
        tags: '',
        tastingNotes: '',
        bestFor: '',
        variants: [{ weight: '250gm', price: 0 }]
    });

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

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const productToCreate = {
                ...newProduct,
                tags: newProduct.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
            };
            const created = await createProduct(productToCreate);
            setProducts(prev => [...prev, created]);
            setIsAddingProduct(false);
            setNewProduct({
                name: '',
                description: '',
                image: '',
                category: 'Beans',
                roast: 'Medium',
                intensity: 3,
                tags: '',
                tastingNotes: '',
                bestFor: '',
                variants: [{ weight: '250gm', price: 0 }]
            });
        } catch (error) {
            console.error(error);
            alert("Failed to create product");
        }
    };

    const addVariant = () => {
        setNewProduct(prev => ({
            ...prev,
            variants: [...prev.variants, { weight: '', price: 0 }]
        }));
    };

    const updateVariant = (index: number, field: 'weight' | 'price', value: string | number) => {
        const updatedVariants = [...newProduct.variants];
        updatedVariants[index] = { ...updatedVariants[index], [field]: value };
        setNewProduct(prev => ({ ...prev, variants: updatedVariants }));
    };

    const removeVariant = (index: number) => {
        if (newProduct.variants.length === 1) return;
        setNewProduct(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
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

                {activeTab === 'products' && isAddingProduct && (
                    <div className="bg-white rounded-xl shadow-lg p-8 mb-8 animate-fade-in border-t-4 border-gold-500">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-serif font-bold text-coffee-900">Add New Product</h2>
                            <button onClick={() => setIsAddingProduct(false)} className="text-gray-400 hover:text-coffee-900">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Product Name</label>
                                    <input required type="text" className="w-full border border-gray-200 p-3 rounded-lg focus:border-gold-500 outline-none" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Description</label>
                                    <textarea required rows={3} className="w-full border border-gray-200 p-3 rounded-lg focus:border-gold-500 outline-none resize-none" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Category</label>
                                        <select className="w-full border border-gray-200 p-3 rounded-lg focus:border-gold-500 outline-none bg-white" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                                            <option>Beans</option>
                                            <option>Filter Powder</option>
                                            <option>Instant</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Roast Profile</label>
                                        <select className="w-full border border-gray-200 p-3 rounded-lg focus:border-gold-500 outline-none bg-white" value={newProduct.roast} onChange={(e) => setNewProduct({ ...newProduct, roast: e.target.value })}>
                                            <option>Light</option>
                                            <option>Medium</option>
                                            <option>Dark</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Intensity (1-5)</label>
                                        <input type="number" min="1" max="5" className="w-full border border-gray-200 p-3 rounded-lg focus:border-gold-500 outline-none" value={newProduct.intensity} onChange={(e) => setNewProduct({ ...newProduct, intensity: parseInt(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Tags (comma separated)</label>
                                        <input type="text" placeholder="Bold, Rich, Fruity" className="w-full border border-gray-200 p-3 rounded-lg focus:border-gold-500 outline-none" value={newProduct.tags} onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Tasting Notes</label>
                                        <input type="text" placeholder="Caramel, Citrus" className="w-full border border-gray-200 p-3 rounded-lg focus:border-gold-500 outline-none" value={newProduct.tastingNotes} onChange={(e) => setNewProduct({ ...newProduct, tastingNotes: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Best Prepared As</label>
                                        <input type="text" placeholder="Pour Over, French Press" className="w-full border border-gray-200 p-3 rounded-lg focus:border-gold-500 outline-none" value={newProduct.bestFor} onChange={(e) => setNewProduct({ ...newProduct, bestFor: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Image URL (e.g. /assets/new.jpg)</label>
                                    <input required type="text" className="w-full border border-gray-200 p-3 rounded-lg focus:border-gold-500 outline-none font-mono text-sm" value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">Variants & Pricing</label>
                                    <button type="button" onClick={addVariant} className="text-gold-600 hover:text-gold-700 text-xs font-bold uppercase tracking-widest">+ Add Variant</button>
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                    {newProduct.variants.map((v, i) => (
                                        <div key={i} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-100 animate-slide-in-right">
                                            <div className="flex-1">
                                                <input required type="text" placeholder="Weight (e.g. 250gm)" className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-gold-500 outline-none" value={v.weight} onChange={(e) => updateVariant(i, 'weight', e.target.value)} />
                                            </div>
                                            <div className="flex-1 flex items-center gap-1">
                                                <span className="text-gray-400 text-sm">₹</span>
                                                <input required type="number" placeholder="Price" className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-gold-500 outline-none" value={v.price} onChange={(e) => updateVariant(i, 'price', parseInt(e.target.value))} />
                                            </div>
                                            <button type="button" onClick={() => removeVariant(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-6">
                                    <button type="submit" className="w-full bg-coffee-900 text-white py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-gold-600 transition-all shadow-xl hover:-translate-y-1 transform">
                                        Create Product
                                    </button>
                                    <button type="button" onClick={() => setIsAddingProduct(false)} className="w-full mt-3 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-coffee-900 transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

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
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                order.status === 'Paid' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {order.status || 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* New Product Toggle Card */}
                        {!isAddingProduct && (
                            <div
                                onClick={() => setIsAddingProduct(true)}
                                className="border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center h-64 cursor-pointer hover:border-gold-500 hover:bg-white transition-all group shadow-sm hover:shadow-md"
                            >
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-gold-50 transition-colors">
                                        <span className="text-3xl text-gray-300 group-hover:text-gold-600">+</span>
                                    </div>
                                    <p className="text-gray-400 font-bold group-hover:text-coffee-900 transition-colors">Add New Product</p>
                                    <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">Store Inventory</p>
                                </div>
                            </div>
                        )}

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
