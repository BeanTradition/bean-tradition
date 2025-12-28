const supabase = require('./config/supabaseClient');

async function updateRobustaRoast() {
    console.log('Updating Robusta Coffee Beans roast to Medium...');

    const { data, error } = await supabase
        .from('products')
        .update({ roast: 'Medium' })
        .eq('name', 'Robusta Coffee Beans')
        .select();

    if (error) {
        console.error('Error updating Robusta roast:', error);
        process.exit(1);
    }

    if (data && data.length > 0) {
        console.log('Successfully updated Robusta roast:', data[0]);
    } else {
        console.log('No product found with name "Robusta Coffee Beans". Checking for variations...');
        // Try partial match if exact match fails
        const { data: partialData, error: partialError } = await supabase
            .from('products')
            .update({ roast: 'Medium' })
            .ilike('name', '%Robusta%')
            .select();

        if (partialError) {
            console.error('Error updating Robusta roast (partial):', partialError);
            process.exit(1);
        }

        if (partialData && partialData.length > 0) {
            console.log('Successfully updated Robusta (partial match):', partialData);
        } else {
            console.log('Could not find any Robusta product to update.');
        }
    }
    process.exit(0);
}

updateRobustaRoast();
