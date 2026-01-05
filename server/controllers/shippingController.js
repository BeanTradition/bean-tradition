const delhivery = require('../utils/delhivery');

// @desc    Calculate shipping rates
// @route   POST /api/shipping/rates
// @access  Public
const getShippingRates = async (req, res) => {
    const { destination, weight } = req.body;

    if (!destination) {
        return res.status(400).json({ message: 'Destination pincode is required' });
    }

    try {
        // Default origin is Bean Tradition's warehouse (example pincode: 500001)
        // In real use, this would come from an environment variable or DB
        const origin = process.env.ORIGIN_PINCODE || '500001';

        // Delhivery weight is in grams for some APIs, kgs for others. 
        // Our cart weight is likely kgs (e.g., 0.25 for 250gm)
        // Convert kgs to grams if needed
        const weightGrams = weight ? weight * 1000 : 500;

        const data = await delhivery.calculateRates({
            origin,
            destination,
            weight: weightGrams
        });

        // The exact structure of Delhivery response varies by plan
        // Typically it returns an array of possible services
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getShippingRates
};
