import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Invoking mercado-pago-create-preference...');
    const { data, error } = await supabase.functions.invoke('mercado-pago-create-preference', {
        body: {
            order_id: 'test_order_123',
            items: [
                {
                    id: 'item_1',
                    title: 'Test Item',
                    unit_price: 15.50,
                    quantity: 2,
                    category_id: 'others'
                }
            ]
        }
    });

    if (error) {
        console.error('Function Error:', error.message);
        if (error.context) {
            const text = await error.context.text();
            console.error('Error Details:', text);
        }
    } else {
        console.log('Success:', data);
    }
}

test();
