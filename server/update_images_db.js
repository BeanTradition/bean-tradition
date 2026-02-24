const supabase = require('./config/supabaseClient');

async function updateProductImages() {
    console.log('Updating product image paths in Supabase...');

    const updates = [
        { name: 'Arabica Coffee Beans', image: '/assets/Arabica.jpg' },
        { name: 'Robusta Coffee Beans', image: '/assets/Robusta.jpg' },
        { name: 'Filter Coffee Powder', image: '/assets/Filter.jpg' },
        { name: 'Instant Coffee Powder', image: '/assets/Instant.jpg' }
    ];

    for (const update of updates) {
        const { data, error } = await supabase
            .from('products')
            .update({ image: update.image })
            .ilike('name', `%${update.name.split(' ')[0]}%`)
            .select();

        if (error) {
            console.error(`Error updating ${update.name}:`, error);
        } else if (data && data.length > 0) {
            console.log(`Successfully updated ${update.name} to ${update.image}`);
        } else {
            console.log(`No product found matching ${update.name}`);
        }
    }

    console.log('Database update complete.');
    process.exit(0);
}

updateProductImages();
