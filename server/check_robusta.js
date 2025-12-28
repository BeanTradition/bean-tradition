const supabase = require('./config/supabaseClient');

async function checkRobustaRoast() {
    const { data, error } = await supabase
        .from('products')
        .select('name, roast')
        .ilike('name', '%Robusta%');

    if (error) {
        console.error('Error fetching Robusta:', error);
    } else {
        console.log('Current Robusta products:', data);
    }
}

checkRobustaRoast();
