const express = require('express');
const router = express.Router();
const {
    authUser,
    registerUser,
    getUserProfile,
    updateUserProfile,
    googleLogin,
    forgotPassword,
    resetPassword,
    getUsers,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(registerUser)
    .get(protect, admin, getUsers);
router.post('/login', authUser);
router.post('/google-login', googleLogin);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router
    .route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

module.exports = router;
