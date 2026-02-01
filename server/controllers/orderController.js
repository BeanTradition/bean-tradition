const supabase = require('../config/supabaseClient');
const delhiveryService = require('../utils/delhivery');
const crypto = require('crypto');

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
        // --- LOOPHOLE FIX: Razorpay Signature Verification ---
        const { paymentResult } = req.body;
        if (!paymentResult || !paymentResult.id || !paymentResult.razorpay_order_id || !paymentResult.razorpay_signature) {
            return res.status(400).json({ message: 'Payment information missing' });
        }

        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${paymentResult.razorpay_order_id}|${paymentResult.id}`)
            .digest('hex');

        if (generated_signature !== paymentResult.razorpay_signature) {
            console.error('Security Alert: Invalid Razorpay Signature detected!');
            return res.status(400).json({ message: 'Transaction not legit!' });
        }
        // --- END SIGNATURE FIX ---

        // --- LOOPHOLE FIX: Price & Coupon Validation ---
        let calculatedItemsPrice = 0;
        try {
            for (const item of orderItems) {
                const { data: product, error: pError } = await supabase
                    .from('products')
                    .select('variants')
                    .eq('id', item.product)
                    .single();

                if (pError || !product) {
                    return res.status(400).json({ message: `Product not found: ${item.name}` });
                }

                // Find the correct variant in DB
                const dbVariant = product.variants.find(v => v.weight === item.weight);
                if (!dbVariant) {
                    return res.status(400).json({ message: `Invalid variant for ${item.name}` });
                }

                // Add to subtotal using DB price, NOT frontend price
                calculatedItemsPrice += (dbVariant.price * item.quantity);
            }

            // Validate Coupon if applied
            let discountAmount = 0;
            const appliedCouponCode = req.body.paymentResult?.coupon_applied;
            if (appliedCouponCode) {
                const { data: coupon, error: cError } = await supabase
                    .from('coupons')
                    .select('*')
                    .eq('code', appliedCouponCode.toUpperCase())
                    .single();

                if (!cError && coupon && coupon.isActive) {
                    // Check if usage limit reached
                    if (coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit) {
                        if (coupon.discountType === 'PERCENTAGE') {
                            discountAmount = Math.round((calculatedItemsPrice * coupon.discountValue) / 100);
                        } else {
                            discountAmount = coupon.discountValue;
                        }
                    }
                }
            }

            const expectedTotal = calculatedItemsPrice + (shippingPrice || 0) - discountAmount;

            // Allow 1 INR difference for rounding
            if (Math.abs(expectedTotal - totalPrice) > 1) {
                console.error(`Security Alert: Price Mismatch. Expected: ${expectedTotal}, Got: ${totalPrice}`);
                return res.status(400).json({ message: 'Security Alert: Order price mismatch detected.' });
            }
        } catch (validationError) {
            console.error('Order Validation Error:', validationError);
            return res.status(500).json({ message: 'Error validating order prices' });
        }
        // --- END LOOPHOLE FIX ---

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
                "totalPrice": totalPrice, // We know this matches expectedTotal now
                "isPaid": true,
                "paidAt": new Date().toISOString(),
                "status": "Paid",
                "user_name": req.user.name // Store name at top level for Supabase visibility
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase Order Error:', JSON.stringify(error, null, 2));
            return res.status(500).json({ message: 'Order creation failed', error: error.message });
        }

        // Deduct Inventory Stock & Calculate Total Weight
        let totalOrderWeight = 0;
        try {
            for (const item of orderItems) {
                const productId = item.product;
                const quantity = item.quantity;
                const weightStr = item.weight.toLowerCase();

                let weightInGrams = 0;
                const numericalWeight = parseFloat(weightStr);

                if (weightStr.includes('kg')) {
                    weightInGrams = numericalWeight * 1000;
                } else if (weightStr.includes('gm')) {
                    weightInGrams = numericalWeight;
                } else {
                    weightInGrams = 500;
                }

                totalOrderWeight += (weightInGrams * quantity);
                const totalGramsToDeduct = weightInGrams * quantity;
                const profileKey = item.roast || item.intensity || 'Default';

                // Atomic Update using RPC to prevent race conditions
                // We use the new deduct_detailed_stock which handles JSONB stock map
                await supabase.rpc('deduct_detailed_stock', {
                    p_id: productId,
                    p_key: profileKey,
                    p_amount: totalGramsToDeduct
                });
            }
        } catch (stockError) {
            console.error('Stock Deduction Error:', stockError);
        }

        // Create Delhivery Shipment
        try {
            const productsDesc = orderItems.map(item => {
                let detail = `${item.name} (${item.weight})`;
                if (item.roast) detail += ` - ${item.roast} Roast`;
                if (item.intensity) detail += ` [${item.intensity}]`;
                return `${detail} (Qty: ${item.quantity})`;
            }).join(', ');

            await delhiveryService.createShipment({
                name: shippingAddress.name || req.user.name,
                address: shippingAddress.address,
                pincode: shippingAddress.pincode,
                phone: shippingAddress.phone,
                orderId: createdOrder.id,
                amount: totalPrice,
                weight: totalOrderWeight,
                productsDesc: productsDesc
            });
        } catch (delhiveryError) {
            console.error('Delhivery Shipment Error:', delhiveryError);
        }

        // Increment Coupon Usage Count
        try {
            const couponCode = req.body.paymentResult?.coupon_applied;
            if (couponCode) {
                const { data: coupon, error: fetchError } = await supabase
                    .from('coupons')
                    .select('id, usageCount')
                    .eq('code', couponCode.toUpperCase())
                    .single();

                if (!fetchError && coupon) {
                    await supabase
                        .from('coupons')
                        .update({ usageCount: (coupon.usageCount || 0) + 1 })
                        .eq('id', coupon.id);
                }
            }
        } catch (couponError) {
            console.error('Coupon Increment Error:', couponError);
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
        // --- LOOPHOLE FIX: Order Snooping ---
        if (!req.user.isAdmin && order.user_id !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to view this order' });
        }
        // --- END FIX ---

        // Transform 'users' back to 'user' for compatibility if needed or handle in frontend
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

    const { data: order } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', id)
        .single();

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    if (!req.user.isAdmin && order.user_id !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized to update this order' });
    }

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
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

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
        .select('*, users(id, name)')
        .order('created_at', { ascending: false }); // Newest first

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
