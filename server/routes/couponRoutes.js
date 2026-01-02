
const express = require('express');
const router = express.Router();
const {
    createCoupon,
    getCoupons,
    updateCoupon,
    deleteCoupon,
    validateCoupon
} = require('../controllers/couponController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route to validate
router.post('/validate', validateCoupon);

// Admin routes
router.route('/')
    .get(protect, admin, getCoupons)
    .post(protect, admin, createCoupon);

router.route('/:id')
    .put(protect, admin, updateCoupon)
    .delete(protect, admin, deleteCoupon);

module.exports = router;
