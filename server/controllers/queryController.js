const supabase = require('../config/supabaseClient');

// @desc    Create new query
// @route   POST /api/queries
// @access  Public
const createQuery = async (req, res) => {
    const { name, email, type, message } = req.body;

    if (!name || !email || !type || !message) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

    const { data, error } = await supabase
        .from('queries')
        .insert([{ name, email, type, message }])
        .select()
        .single();

    if (error) {
        console.error('Supabase Query Error:', error);
        return res.status(500).json({ message: 'Failed to send query', error: error.message });
    }

    res.status(201).json(data);
};

// @desc    Get all queries
// @route   GET /api/queries
// @access  Private/Admin
const getQueries = async (req, res) => {
    const { data: queries, error } = await supabase
        .from('queries')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ message: error.message });
    }

    res.json(queries);
};

module.exports = {
    createQuery,
    getQueries
};
