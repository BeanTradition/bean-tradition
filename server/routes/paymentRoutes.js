const express = require('express');
const router = express.Router();
const {
    createRazorpayOrder,
    verifyRazorpayPayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/create-order').post(protect, createRazorpayOrder);
router.route('/verify-payment').post(protect, verifyRazorpayPayment);

module.exports = router;
