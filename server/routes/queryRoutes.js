const express = require('express');
const router = express.Router();
const { createQuery, getQueries } = require('../controllers/queryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', createQuery);
router.get('/', protect, admin, getQueries);

module.exports = router;
