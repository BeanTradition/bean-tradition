const { OAuth2Client } = require('google-auth-library');
const supabase = require('../config/supabaseClient');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

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

    const isAdmin = (email === 'beantradition@gmail.com');

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
            const isAdmin = (email === 'beantradition@gmail.com');
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

// @desc    Forgot password
// @route   POST /api/users/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(404).json({ message: 'User not found with that email' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set expiry (10 mins)
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        const resetExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        const { error: updateError } = await supabase
            .from('users')
            .update({
                reset_password_token: hashedToken,
                reset_password_expires: resetExpires
            })
            .eq('id', user.id);

        if (updateError) {
            return res.status(500).json({ message: 'Error updating user reset token' });
        }

        // Create reset URL
        // In local dev, it would be http://localhost:5173/reset-password/${resetToken}
        // But since we use view-based routing, we'll send a simple code or just the link
        const resetUrl = `${req.get('origin')}/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a put request to: \n\n ${resetUrl}`;

        const html = `
            <div style="font-family: serif; color: #333;">
                <h1 style="color: #A2672D;">Bean Tradition</h1>
                <p>You requested a password reset. Please click the button below to set a new password:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #A2672D; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Reset Password</a>
                <p style="margin-top: 20px; font-size: 12px; color: #777;">If you didn't request this, please ignore this email. This link expires in 10 minutes.</p>
            </div>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset - Bean Tradition',
                message,
                html
            });

            res.status(200).json({ message: 'Email sent successfully' });
        } catch (err) {
            console.error("Email send error:", err);
            // Clear token if email fails
            await supabase
                .from('users')
                .update({ reset_password_token: null, reset_password_expires: null })
                .eq('id', user.id);

            return res.status(500).json({ message: 'Email could not be sent. Please check your SMTP settings.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Reset password
// @route   PUT /api/users/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('reset_password_token', hashedToken)
            .gt('reset_password_expires', new Date().toISOString())
            .single();

        if (error || !user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const { error: updateError } = await supabase
            .from('users')
            .update({
                password: hashedPassword,
                reset_password_token: null,
                reset_password_expires: null
            })
            .eq('id', user.id);

        if (updateError) {
            return res.status(500).json({ message: 'Update failed' });
        }

        res.status(200).json({
            _id: user.id,
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user.id),
            message: 'Password reset successful'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, phone, isAdmin, joinedDate')
        .order('joinedDate', { ascending: false });

    if (error) {
        return res.status(500).json({ message: error.message });
    }

    // Map _id for compatibility
    const mappedUsers = users.map(u => ({ ...u, _id: u.id }));
    res.json(mappedUsers);
};

module.exports = { authUser, registerUser, getUserProfile, updateUserProfile, googleLogin, forgotPassword, resetPassword, getUsers };
