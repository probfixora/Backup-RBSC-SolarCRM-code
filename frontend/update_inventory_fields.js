const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(Boolean).map(line => line.split('=')));

const supabaseUrl = env['REACT_APP_SUPABASE_URL'];
const supabaseKey = env['REACT_APP_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

function parseItem(name) {
  let brand = '';
  let capacity = '';
  let model_number = '';
  let category = '';

  const lower = name.toLowerCase();
  
  if (lower.includes('inverter') || lower.includes('gti')) {
    category = 'Inverter';
  } else if (lower.includes('battery') || lower.includes('htt') || lower.includes('ltt')) {
    category = 'Battery';
  } else if (lower.includes('structure') || lower.includes('fastner') || lower.includes('connector')) {
    category = 'BOS / Structure';
  } else if (lower.includes('system') || lower.includes('plant') || lower.includes('set')) {
    category = 'System Kit';
  } else {
    category = 'Solar Panel';
  }

  // Extract brand
  const brands = ['Adani', 'Amaze', 'EmmVee', 'GOODWE', 'Lum', 'Luminous', 'Microtek', 'Premier', 'Servotec', 'Servotech', 'Sungrow', 'Tata', 'TP Solar', 'Waaree', 'Waree', 'Anchor'];
  for (const b of brands) {
    if (lower.includes(b.toLowerCase())) {
      brand = b;
      break;
    }
  }

  // Extract capacity
  const capMatch = name.match(/(\d+(?:\.\d+)?\s*(?:W|KW|Wp|V|Ah|KVA|wp|w))/i);
  if (capMatch) {
    capacity = capMatch[1];
  }

  // Model number is roughly the rest of the string
  model_number = name.replace(new RegExp(brand, 'i'), '').replace(capacity, '').trim().replace(/^[- ]+|[- ]+$/g, '');

  return { brand, capacity, model_number, category };
}

async function run() {
  console.log('Fetching existing items...');
  const { data: items, error: fetchErr } = await supabase.from('inventory').select('id, name');
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }

  console.log(`Found ${items.length} items. Updating...`);
  
  for (const item of items) {
    const parsed = parseItem(item.name);
    
    const { error: updateErr } = await supabase
      .from('inventory')
      .update({
        brand: parsed.brand,
        capacity: parsed.capacity,
        model_number: parsed.model_number,
        category: parsed.category
      })
      .eq('id', item.id);

    if (updateErr) {
      console.error(`Error updating ${item.name}:`, updateErr);
    }
  }

  console.log('Finished updating items!');
}

run();
