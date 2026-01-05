const supabase = require('../config/supabaseClient');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    const { data: products, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server Error' });
    }

    // Map _id for frontend compatibility if needed
    const mappedProducts = products.map(p => ({
        ...p,
        _id: p.id,
        // Ensure variants is parsed if it comes as string (should be object from JSONB but just in case)
        variants: typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants,
        tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags,
        stock_weight_grams: p.stock_weight_grams || 0
    }));

    res.json(mappedProducts);
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', req.params.id)
        .single();

    if (product) {
        res.json({ ...product, _id: product.id });
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', req.params.id);

    if (!error) {
        res.json({ message: 'Product removed' });
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    const { name, image, category, countInStock, stock_weight_grams, numReviews, description, roast, intensity, variants } = req.body;

    // Note: 'price' is not in my DB schema for top level, it is in variants usually, but frontend sends it?
    // Looking at Types.ts: Product has variants. Variants have price. 
    // The 'createProduct' in previous controller took 'price' but Product.js model didn't have top level price?
    // Wait, Product.js model DID NOT have top level price. It had variants.
    // I will just ignore top level price if sent, relying on variants.

    const { data: createdProduct, error } = await supabase
        .from('products')
        .insert([{
            name,
            // user: req.user.id, // Optional column
            image,
            category,
            "countInStock": countInStock || 0,
            "numReviews": numReviews || 0,
            description,
            roast,
            intensity,
            variants, // JSONB array
            stock_weight_grams: stock_weight_grams || 0
        }])
        .select()
        .single();

    if (error) {
        console.error(error);
        return res.status(400).json({ message: error.message });
    }
    res.status(201).json({ ...createdProduct, _id: createdProduct.id });
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    const {
        name,
        description,
        image,
        category,
        roast,
        intensity,
        variants,
        stock_weight_grams
    } = req.body;

    const { data: updatedProduct, error } = await supabase
        .from('products')
        .update({
            name,
            description,
            image,
            category,
            roast,
            intensity,
            variants,
            stock_weight_grams
        })
        .eq('id', req.params.id)
        .select()
        .single();

    if (updatedProduct) {
        res.json({ ...updatedProduct, _id: updatedProduct.id });
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
};

module.exports = {
    getProducts,
    getProductById,
    deleteProduct,
    createProduct,
    updateProduct,
};
