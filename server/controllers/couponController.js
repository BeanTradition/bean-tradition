
const supabase = require('../config/supabaseClient');

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res) => {
    const { code, discountType, discountValue, expirationDate, usageLimit } = req.body;

    // Basic Validation
    if (!code || !discountType || !discountValue) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const { data, error } = await supabase
            .from('coupons')
            .insert([{
                code: code.toUpperCase(), // Store uppercase for consistency
                "discountType": discountType,
                "discountValue": discountValue,
                "expirationDate": expirationDate || null,
                "usageLimit": usageLimit === 'unlimited' ? null : (usageLimit ? parseInt(usageLimit) : null),
                "isActive": true
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return res.status(400).json({ message: 'Coupon code already exists' });
            }
            throw error;
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('Create Coupon Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Get Coupons Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update coupon (Disable/Enable)
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res) => {
    const { isActive } = req.body;

    try {
        const { data, error } = await supabase
            .from('coupons')
            .update({ "isActive": isActive })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Update Coupon Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res) => {
    try {
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Coupon removed' });
    } catch (error) {
        console.error('Delete Coupon Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Validate Coupon
// @route   POST /api/coupons/validate
// @access  Public
const validateCoupon = async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ message: 'No coupon code provided' });
    }

    try {
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error || !coupon) {
            return res.status(404).json({ message: 'Invalid coupon code' });
        }

        // Check if active
        if (!coupon.isActive) {
            return res.status(400).json({ message: 'This coupon has been disabled' });
        }

        // Check expiration
        if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date()) {
            return res.status(400).json({ message: 'This coupon has expired' });
        }

        // Check usage limit
        if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'This coupon usage limit has been reached' });
        }

        // Valid
        res.json({
            valid: true,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            code: coupon.code,
            id: coupon.id // Needed to increment usage count on order placement?
            // Actually, usually we increment usage on successful order. 
            // We'll need to handle that in the order creation or payment success.
            // For now, let's just return validity.
        });

    } catch (error) {
        console.error('Validate Coupon Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createCoupon,
    getCoupons,
    updateCoupon,
    deleteCoupon,
    validateCoupon
};
