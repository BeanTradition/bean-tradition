const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient'); // Updated import

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user from Supabase using ID
            const { data: user, error } = await supabase
                .from('users')
                .select('id, name, email, isAdmin, phone, address') // Exclude password mostly
                .eq('id', decoded.id)
                .single();

            if (error || !user) {
                throw new Error('Not authorized');
            }

            req.user = user;

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };
