
import React, { useEffect, useState } from 'react';
import { getAllOrders, getAllUsers, deliverOrder, fetchProducts, deleteProduct as apiDeleteProduct, createProduct, updateProduct, getCoupons, createCoupon, updateCouponStatus, deleteCoupon as apiDeleteCoupon } from '../services/api';
import { Order, Product, Coupon, User } from '../types';
import { generateInvoice, generateCustomerReport, generateMonthlySalesReport } from '../utils/pdfGenerator';

interface AdminDashboardProps {
    onBack: () => void;
    onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, onLogout }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'coupons' | 'users'>('orders');
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
        variants: [{ weight: '250gm', price: 0 }],
        stock_weight_grams: 5000, // Default 5kg
        stock_by_profile: {} as Record<string, number>
    });

    // Coupon Form State
    const [isAddingCoupon, setIsAddingCoupon] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        expirationDate: '',
        usageLimitType: 'unlimited', // UI helper
        usageLimitAmount: 1
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ordersData, productsData, couponsData, usersData] = await Promise.all([
                getAllOrders(),
                fetchProducts(),
                getCoupons(),
                getAllUsers()
            ]);
            setOrders(ordersData);
            setProducts(productsData);
            setCoupons(couponsData);
            setUsers(usersData);
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
                variants: [{ weight: '250gm', price: 0 }],
                stock_weight_grams: 5000,
                stock_by_profile: {}
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

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const couponToCreate: Partial<Coupon> = {
                code: newCoupon.code,
                discountType: newCoupon.discountType as 'PERCENTAGE' | 'FIXED',
                discountValue: Number(newCoupon.discountValue),
                expirationDate: newCoupon.expirationDate || undefined,
                usageLimit: newCoupon.usageLimitType === 'unlimited' ? null : Number(newCoupon.usageLimitAmount),
                isActive: true
            };
            const created = await createCoupon(couponToCreate);
            setCoupons(prev => [created, ...prev]);
            setIsAddingCoupon(false);
            setNewCoupon({
                code: '',
                discountType: 'PERCENTAGE',
                discountValue: 0,
                expirationDate: '',
                usageLimitType: 'unlimited',
                usageLimitAmount: 1
            });
        } catch (error) {
            console.error(error);
            alert("Failed to create coupon");
        }
    };

    const handleToggleCoupon = async (id: string, currentStatus: boolean) => {
        try {
            const updated = await updateCouponStatus(id, !currentStatus);
            setCoupons(prev => prev.map(c => c.id === id ? updated : c));
        } catch (error) {
            console.error(error);
            alert("Failed to update coupon");
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await apiDeleteCoupon(id);
            setCoupons(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
            alert("Failed to delete coupon");
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

                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gold-100">
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gold-600 mb-1">Business Intelligence</h2>
                        <p className="text-sm text-gray-500">Generate financial summaries for active bookkeeping.</p>
                    </div>
                    <button
                        onClick={() => generateMonthlySalesReport(orders)}
                        className="bg-gold-500 text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-coffee-900 transition-all shadow-md transform hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Download Monthly Sales Report
                    </button>
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
                    <button
                        onClick={() => setActiveTab('coupons')}
                        className={`px-6 py-3 rounded-lg font-bold ${activeTab === 'coupons' ? 'bg-coffee-900 text-white' : 'bg-white text-coffee-900'}`}
                    >
                        Coupons ({coupons.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-3 rounded-lg font-bold ${activeTab === 'users' ? 'bg-coffee-900 text-white' : 'bg-white text-coffee-900'}`}
                    >
                        Users ({users.length})
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
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Inventory by Profile (in Grams)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(newProduct.category === 'Beans' ? ['Light', 'Medium', 'Dark'] : ['Light', 'Medium', 'Strong']).map(profile => (
                                            <div key={profile}>
                                                <label className="block text-[10px] text-gray-400 mb-1">{profile}</label>
                                                <input
                                                    type="number"
                                                    placeholder="Grams"
                                                    className="w-full border border-gray-200 p-2 rounded text-xs"
                                                    value={newProduct.stock_by_profile[profile] || 0}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        setNewProduct({
                                                            ...newProduct,
                                                            stock_by_profile: { ...newProduct.stock_by_profile, [profile]: val }
                                                        });
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase italic">Each selection on the shop page will deduct from these pools.</p>
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

                {activeTab === 'orders' && (
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-coffee-50 border-b">
                                <tr>
                                    <th className="p-4 font-bold text-coffee-900">Order No.</th>
                                    <th className="p-4 font-bold text-coffee-900">Date</th>
                                    <th className="p-4 font-bold text-coffee-900">Customer</th>
                                    <th className="p-4 font-bold text-coffee-900">Items</th>
                                    <th className="p-4 font-bold text-coffee-900">Amount</th>
                                    <th className="p-4 font-bold text-coffee-900">Status</th>
                                    <th className="p-4 font-bold text-coffee-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {orders.map(order => (
                                    <tr key={order.id || (order as any)._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-coffee-900 text-xs">{(order as any).order_number || order.id || (order as any)._id}</p>
                                        </td>
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
                                            <div className="font-bold">
                                                {(order as any).shippingAddress?.name || (order as any).user?.name || 'Guest'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {(order as any).paymentResult?.email_address || (order as any).user?.email}
                                            </div>
                                            {(order as any).shippingAddress?.phone && (
                                                <div className="text-[10px] text-coffee-600 mt-1">📞 {(order as any).shippingAddress.phone}</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 max-w-[200px]">
                                                {((order as any).orderItems || order.items || []).map((item: any, i: number) => (
                                                    <div key={i} className="text-[10px] bg-coffee-50 p-1.5 rounded border border-coffee-100/50 leading-tight">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <span className="font-bold text-coffee-900 truncate">{item.name}</span>
                                                            <span className="bg-coffee-900 text-white px-1 rounded-sm flex-shrink-0">x{item.quantity}</span>
                                                        </div>
                                                        <div className="text-[9px] text-coffee-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                                            {item.weight || item.selectedVariant?.weight}{item.roast ? ` • ${item.roast} Roast` : ''}{item.intensity ? ` • Int: ${item.intensity}` : ''}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold whitespace-nowrap text-coffee-900">₹{order.total || order.totalPrice}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase text-center ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'Paid' || order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {order.status || 'Pending'}
                                                </span>
                                                {order.status === 'Paid' && (
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm("Mark as Delivered?")) {
                                                                try {
                                                                    await deliverOrder(order.id || (order as any)._id);
                                                                    loadData();
                                                                } catch (err) { alert("Failed to mark delivered"); }
                                                            }
                                                        }}
                                                        className="text-[9px] font-bold text-coffee-600 underline hover:text-gold-600 uppercase"
                                                    >
                                                        Mark Delivered
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => generateInvoice(order, (order as any).user)}
                                                    className="text-[9px] font-bold text-gold-600 underline hover:text-coffee-900 uppercase mt-1"
                                                >
                                                    Download Invoice
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'products' && (
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
                            <div key={product.id || product._id} className="bg-white rounded-xl shadow overflow-hidden flex flex-col border border-gray-100">
                                <img
                                    src={
                                        product.name.toLowerCase().includes('arabica') ? '/assets/Arabica Coffee Beans.jpg' :
                                            product.name.toLowerCase().includes('robusta') ? '/assets/Robusta Coffee Beans.jpg' :
                                                product.name.toLowerCase().includes('filter') ? '/assets/Filter Coffee Powder.jpg' :
                                                    product.name.toLowerCase().includes('instant') ? '/assets/Instant Coffee Powder.jpg' :
                                                        product.image
                                    }
                                    alt={product.name}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (target.src !== product.image) {
                                            target.src = product.image;
                                        }
                                    }}
                                    className="h-40 w-full object-contain"
                                />
                                <div className="p-4 flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-coffee-900 leading-tight">{product.name}</h3>
                                        <span className="bg-coffee-50 text-coffee-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{product.category}</span>
                                    </div>

                                    <div className="bg-gold-50 p-3 rounded-lg mb-4 border border-gold-100">
                                        <div className="flex justify-between items-center text-xs font-bold text-gold-800 uppercase tracking-tighter mb-2">
                                            <span>Current Stock (Grams)</span>
                                            <span className="bg-gold-200 px-2 py-0.5 rounded">Total: {((product as any).stock_by_profile ? Object.values((product as any).stock_by_profile).reduce((a: any, b: any) => a + (b || 0), 0) : product.stock_weight_grams || 0) / 1000} KG</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(product.category === 'Beans' ? ['Light', 'Medium', 'Dark'] : ['Light', 'Medium', 'Strong']).map(profile => (
                                                <div key={profile}>
                                                    <label className="block text-[8px] text-gold-600 uppercase font-bold mb-0.5">{profile}</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-white border border-gold-200 text-[10px] p-1 rounded outline-none focus:border-gold-500"
                                                        defaultValue={(product as any).stock_by_profile?.[profile] || 0}
                                                        onBlur={async (e) => {
                                                            const newValue = parseInt(e.target.value) || 0;
                                                            try {
                                                                const currentStocks = (product as any).stock_by_profile || {};
                                                                const updatedStocks = { ...currentStocks, [profile]: newValue };
                                                                const totalGrams = Object.values(updatedStocks).reduce((a: any, b: any) => a + (b || 0), 0) as number;

                                                                const updated = await updateProduct(product.id || product._id!, {
                                                                    stock_by_profile: updatedStocks,
                                                                    stock_weight_grams: totalGrams
                                                                });
                                                                setProducts(prev => prev.map(p => p.id === (product.id || product._id) ? updated : p));
                                                            } catch (err) {
                                                                alert("Failed to update stock");
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-auto">
                                        <button
                                            onClick={() => handleDeleteProduct(product.id || product._id!)}
                                            className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest transition-colors"
                                        >
                                            Delete
                                        </button>
                                        <div className="text-[10px] text-gray-400 font-mono">
                                            ID: {product.id?.substring(0, 8)}...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'coupons' && (
                    <div>
                        {/* Add Coupon Button */}
                        {!isAddingCoupon && (
                            <button
                                onClick={() => setIsAddingCoupon(true)}
                                className="mb-6 bg-coffee-900 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-gold-600 transition-colors shadow-lg flex items-center gap-2"
                            >
                                <span className="text-xl">+</span> Create New Coupon
                            </button>
                        )}

                        {/* Create Coupon Form */}
                        {isAddingCoupon && (
                            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 animate-fade-in border-t-4 border-gold-500 max-w-2xl">
                                <h3 className="text-xl font-bold mb-6 text-coffee-900">Create New Coupon</h3>
                                <form onSubmit={handleCreateCoupon} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Coupon Code</label>
                                        <input required type="text" className="w-full border p-3 rounded uppercase font-mono" placeholder="SUMMER25" value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Type</label>
                                            <select className="w-full border p-3 rounded" value={newCoupon.discountType} onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value })}>
                                                <option value="PERCENTAGE">Percentage (%)</option>
                                                <option value="FIXED">Fixed Amount (₹)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Value</label>
                                            <input required type="number" className="w-full border p-3 rounded" value={newCoupon.discountValue} onChange={e => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Usage Limit</label>
                                            <select className="w-full border p-3 rounded" value={newCoupon.usageLimitType} onChange={e => setNewCoupon({ ...newCoupon, usageLimitType: e.target.value })}>
                                                <option value="unlimited">Unlimited (Multi-use)</option>
                                                <option value="limited">Limited (Set Count)</option>
                                            </select>
                                        </div>
                                        {newCoupon.usageLimitType === 'limited' && (
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Count</label>
                                                <input type="number" min="1" className="w-full border p-3 rounded" value={newCoupon.usageLimitAmount} onChange={e => setNewCoupon({ ...newCoupon, usageLimitAmount: Number(e.target.value) })} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Expiration Date (Optional)</label>
                                        <input type="date" className="w-full border p-3 rounded" value={newCoupon.expirationDate} onChange={e => setNewCoupon({ ...newCoupon, expirationDate: e.target.value })} />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button type="submit" className="flex-1 bg-coffee-900 text-white py-3 rounded font-bold">Create</button>
                                        <button type="button" onClick={() => setIsAddingCoupon(false)} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded font-bold">Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Coupons Table */}
                        <div className="bg-white rounded-xl shadow overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-coffee-50 border-b">
                                    <tr>
                                        <th className="p-4">Code</th>
                                        <th className="p-4">Discount</th>
                                        <th className="p-4">Limit</th>
                                        <th className="p-4">Used</th>
                                        <th className="p-4">Expiry</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {coupons.map(coupon => (
                                        <tr key={coupon.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-mono font-bold text-coffee-900">{coupon.code}</td>
                                            <td className="p-4 font-bold text-gold-600">
                                                {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                                            </td>
                                            <td className="p-4 text-sm">{coupon.usageLimit === null ? '∞' : coupon.usageLimit}</td>
                                            <td className="p-4 text-sm">{coupon.usageCount}</td>
                                            <td className="p-4 text-sm text-gray-500">{coupon.expirationDate ? new Date(coupon.expirationDate).toLocaleDateString() : '-'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {coupon.isActive ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="p-4 flex gap-2">
                                                <button
                                                    onClick={() => handleToggleCoupon(coupon.id, coupon.isActive)}
                                                    className="text-xs font-bold underline text-blue-600"
                                                >
                                                    {coupon.isActive ? 'Disable' : 'Enable'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCoupon(coupon.id)}
                                                    className="text-xs font-bold underline text-red-600"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {coupons.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-gray-500">No coupons created yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-coffee-50 border-b">
                                <tr>
                                    <th className="p-4 font-bold text-coffee-900">Joined Date</th>
                                    <th className="p-4 font-bold text-coffee-900">Name</th>
                                    <th className="p-4 font-bold text-coffee-900">Email</th>
                                    <th className="p-4 font-bold text-coffee-900">Phone</th>
                                    <th className="p-4 font-bold text-coffee-900">Role</th>
                                    <th className="p-4 font-bold text-coffee-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {users.map(user => (
                                    <tr key={user.id || (user as any)._id} className="hover:bg-gray-50">
                                        <td className="p-4 text-xs font-mono text-gray-500">
                                            {user.joinedDate ? new Date(user.joinedDate).toLocaleDateString('en-IN') : '-'}
                                        </td>
                                        <td className="p-4 font-bold text-coffee-900">{user.name}</td>
                                        <td className="p-4 text-sm">{user.email}</td>
                                        <td className="p-4 text-sm">{user.phone || '-'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                                                {user.isAdmin ? 'Admin' : 'Customer'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => {
                                                    const userOrders = orders.filter(o => (o as any).user_id === user.id || (o as any).user?.email === user.email);
                                                    generateCustomerReport(userOrders, user);
                                                }}
                                                className="text-[10px] font-bold text-gold-600 hover:text-coffee-900 uppercase border border-gold-200 px-3 py-1 rounded"
                                            >
                                                Download Report
                                            </button>
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
};
