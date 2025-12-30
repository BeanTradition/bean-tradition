
const supabase = require('./config/supabaseClient');

async function updatePrices() {
    console.log('Fetching all products...');
    const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, name, variants');

    if (fetchError) {
        console.error('Error fetching products:', fetchError);
        return;
    }

    console.log(`Found ${products.length} products. Updating prices...`);

    for (const product of products) {
        const updatedVariants = product.variants.map(v => ({
            ...v,
            price: Number(v.price) + 100
        }));

        const { error: updateError } = await supabase
            .from('products')
            .update({ variants: updatedVariants })
            .eq('id', product.id);

        if (updateError) {
            console.error(`Error updating product ${product.name}:`, updateError);
        } else {
            console.log(`Updated price for: ${product.name}`);
        }
    }

    console.log('Price update completed!');
}

updatePrices();
