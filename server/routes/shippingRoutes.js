const express = require('express');
const router = express.Router();
const { getShippingRates } = require('../controllers/shippingController');

router.post('/rates', getShippingRates);

module.exports = router;
