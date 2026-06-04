const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(Boolean).map(line => line.split('=')));

const supabaseUrl = env['REACT_APP_SUPABASE_URL'];
const supabaseKey = env['REACT_APP_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching items to enrich with rich dummy data...');
  const { data: items, error: fetchErr } = await supabase.from('inventory').select('*');
  if (fetchErr) return console.error(fetchErr);

  console.log(`Found ${items.length} items. Updating...`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const cat = item.category || 'Solar Panel';
    const brand = item.brand || 'Generic';

    let purchase = 0;
    let selling = 0;
    let hsn = '85414300'; // Default Solar Panel
    let warranty = '25 Years Performance';
    let supplier = `${brand} Power Solutions Pvt Ltd`;
    let specs = 'High efficiency monocrystalline cells, anti-reflective coating.';
    
    if (cat === 'Inverter') {
      purchase = Math.floor(Math.random() * (150000 - 30000) + 30000);
      hsn = '85044010';
      warranty = '10 Years Replacement';
      specs = 'Pure Sine Wave, Grid-Tie capability, Remote Monitoring.';
    } else if (cat === 'Battery') {
      purchase = Math.floor(Math.random() * (20000 - 10000) + 10000);
      hsn = '85072000';
      warranty = '5 Years Pro-Rata';
      specs = 'Lead Acid Tubular / Lithium Ion hybrid ready.';
    } else if (cat === 'BOS / Structure') {
      purchase = Math.floor(Math.random() * (5000 - 500) + 500);
      hsn = '73089090';
      warranty = '10 Years Rust-Free';
      specs = 'Hot-dip galvanized steel, minimum 80 microns coating.';
    } else {
      // Solar Panel
      purchase = Math.floor(Math.random() * (12000 - 8000) + 8000);
      hsn = '85414300';
    }

    selling = Math.floor(purchase * 1.25);
    const wh = i % 2 === 0 ? 'WH-1 Lucknow' : 'WH-2 Delhi';
    const rack = `R-${Math.floor(Math.random() * 20) + 1}-S-${Math.floor(Math.random() * 5) + 1}`;
    
    const { error: updateErr } = await supabase
      .from('inventory')
      .update({
        unit_price: purchase,
        selling_price: selling,
        hsn_code: hsn,
        warranty_period: warranty,
        supplier_name: supplier,
        supplier_contact: '+91 9876543210',
        supplier_email: `sales@${brand.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        purchase_date: new Date().toISOString(),
        warehouse_location: wh,
        rack_number: rack,
        technical_specs: specs,
        description: `Premium quality ${cat.toLowerCase()} from ${brand} for residential and commercial solar plants.`
      })
      .eq('id', item.id);

    if (updateErr) {
      console.error(`Error updating ${item.name}:`, updateErr);
    }
  }

  console.log('Finished enriching inventory with rich tabular data!');
}

run();
