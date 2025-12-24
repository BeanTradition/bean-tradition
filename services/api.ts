import axios from 'axios';
import { User, Product, Order, CartItem, UserDetails } from '../types';

// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with token
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    // Always read fresh from storage
    const userInfo = localStorage.getItem('kaapi_session');
    console.log("[DEBUG] Interceptor - URL:", config.url);
    if (userInfo) {
        try {
            const parsed = JSON.parse(userInfo);
            console.log("[DEBUG] User From Storage:", parsed);
            // Check both potential locations of token
            const token = parsed.token || parsed._token;
            console.log("[DEBUG] Token found:", token ? "YES (starts with " + token.substring(0, 10) + ")" : "NO");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (e) {
            console.error("Error parsing session", e);
        }
    } else {
        console.log("[DEBUG] No kaapi_session found in localStorage");
    }
    return config;
});

export const login = async (email: string, password: string): Promise<User> => {
    const { data } = await api.post('/users/login', { email, password });
    return data;
};

export const register = async (name: string, email: string, password: string, phone: string): Promise<User> => {
    const { data } = await api.post('/users', { name, email, password, phone });
    return data;
};

export const getProfile = async (): Promise<User> => {
    const { data } = await api.get('/users/profile');
    return data;
};

export const updateProfile = async (userData: Partial<User>): Promise<User> => {
    const { data } = await api.put('/users/profile', userData);
    return data;
};

export const fetchProducts = async (): Promise<Product[]> => {
    const { data } = await api.get('/products');
    return data;
};

export const fetchProductById = async (id: string): Promise<Product> => {
    const { data } = await api.get(`/products/${id}`);
    return data;
};

export const createOrder = async (order: any): Promise<Order> => {
    const { data } = await api.post('/orders', order);
    return data;
};

export const getOrderById = async (id: string): Promise<Order> => {
    const { data } = await api.get(`/orders/${id}`);
    return data;
};

export const payOrder = async (orderId: string, paymentResult: any): Promise<Order> => {
    const { data } = await api.put(`/orders/${orderId}/pay`, paymentResult);
    return data;
};

export const createRazorpayOrder = async (amount: number) => {
    const { data } = await api.post('/payment/create-order', { amount });
    return data;
};

export const verifyRazorpayPayment = async (paymentData: any) => {
    const { data } = await api.post('/payment/verify-payment', paymentData);
    return data;
}

export const getMyOrders = async (): Promise<Order[]> => {
    const { data } = await api.get('/orders/myorders');
    return data;
};

// Admin
export const getAllOrders = async (): Promise<Order[]> => {
    const { data } = await api.get('/orders');
    return data;
};

export const deliverOrder = async (id: string): Promise<Order> => {
    const { data } = await api.put(`/orders/${id}/deliver`);
    return data;
};

export const deleteProduct = async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
};
