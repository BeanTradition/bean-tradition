const supabase = require('../config/supabaseClient');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: 'No order items' });
        return;
    } else {
        const { data: createdOrder, error } = await supabase
            .from('orders')
            .insert([{
                orderItems,
                user_id: req.user.id,
                "shippingAddress": shippingAddress,
                "paymentMethod": paymentMethod,
                "paymentResult": req.body.paymentResult,
                "taxPrice": taxPrice,
                "shippingPrice": shippingPrice,
                "totalPrice": totalPrice,
                "isPaid": true,
                "paidAt": new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase Order Error:', JSON.stringify(error, null, 2));
            return res.status(500).json({ message: 'Order creation failed', error: error.message });
        }

        res.status(201).json({ ...createdOrder, _id: createdOrder.id });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    const { data: order, error } = await supabase
        .from('orders')
        .select('*, users(name, email)') // Join user
        .eq('id', req.params.id)
        .single();

    if (order) {
        // Transform 'users' back to 'user' for compatibility if needed or handle in frontend
        // Mongoose populated 'user'. Supabase returns 'users' object.
        const transformedOrder = {
            ...order,
            user: order.users, // standardizing
            _id: order.id
        };
        res.json(transformedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
    const { id } = req.params;

    const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({
            isPaid: true,
            paidAt: new Date().toISOString(),
            paymentResult: {
                id: req.body.id,
                status: req.body.status,
                update_time: req.body.update_time,
                email_address: req.body.email_address,
            }
        })
        .eq('id', id)
        .select()
        .single();

    if (updatedOrder) {
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
    const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({
            isDelivered: true,
            deliveredAt: new Date().toISOString(),
            status: 'Delivered'
        })
        .eq('id', req.params.id)
        .select()
        .single();

    if (updatedOrder) {
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', req.user.id);

    if (error) {
        res.status(500).json({ message: 'Error fetching orders' });
    } else {
        res.json(orders);
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*, users(id, name)'); // Join to get user name

    if (error) {
        res.status(500).json({ message: error.message });
    } else {
        // Map to structure expected by frontend (user object populated)
        const mappedOrders = orders.map(o => ({
            ...o,
            user: o.users,
            _id: o.id
        }));
        res.json(mappedOrders);
    }
};

module.exports = {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getMyOrders,
    getOrders,
};
