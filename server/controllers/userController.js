const { OAuth2Client } = require('google-auth-library');
const supabase = require('../config/supabaseClient');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(password, user.password);

        if (match) {
            res.json({
                _id: user.id,
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                token: generateToken(user.id),
                phone: user.phone,
                address: user.address
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, phone } = req.body;

    const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

    if (existingUser) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const isAdmin = (email === 'beantradition@gmail.com' || email.includes('beantradition'));

    const { data: user, error } = await supabase
        .from('users')
        .insert([
            { name, email, password: hashedPassword, phone, isAdmin }
        ])
        .select()
        .single();

    if (user && !error) {
        res.status(201).json({
            _id: user.id,
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user.id),
        });
    } else {
        console.error(error);
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = req.user;

    if (user) {
        res.json({
            _id: user.id,
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            phone: user.phone,
            address: user.address
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = req.user;

    if (user) {
        const updates = {};
        if (req.body.name) updates.name = req.body.name;
        if (req.body.email) updates.email = req.body.email;
        if (req.body.phone) updates.phone = req.body.phone;
        if (req.body.address) updates.address = req.body.address;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(req.body.password, salt);
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ message: 'Update failed' });
        }

        res.json({
            _id: updatedUser.id,
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            token: generateToken(updatedUser.id),
            phone: updatedUser.phone,
            address: updatedUser.address
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Auth with Google
// @route   POST /api/users/google-login
// @access  Public
const googleLogin = async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, sub } = payload;

        let { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (!user) {
            const isAdmin = (email === 'beantradition@gmail.com' || email.includes('beantradition'));
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([
                    { name, email, password: hashedPassword, isAdmin, phone: '' }
                ])
                .select()
                .single();

            if (insertError) {
                console.error("Supabase Insert Error:", insertError);
                return res.status(400).json({ message: 'Google Registration Failed' });
            }
            user = newUser;
        }

        res.json({
            _id: user.id,
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user.id),
            phone: user.phone,
            address: user.address
        });

    } catch (err) {
        console.error("Google verify error:", err);
        res.status(401).json({ message: 'Invalid Google Token' });
    }
};

module.exports = { authUser, registerUser, getUserProfile, updateUserProfile, googleLogin };
