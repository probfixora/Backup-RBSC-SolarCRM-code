const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  console.log("Checking customer_uploaded_docs...");
  const { data: docs, error: docsErr } = await supabase.from('customer_uploaded_docs').select('*').order('uploaded_at', { ascending: false }).limit(5);
  if (docsErr) console.error("Error fetching docs:", docsErr);
  else console.log(docs);

  console.log("Checking cases...");
  const { data: cases, error: casesErr } = await supabase.from('cases').select('case_id, tracking_id, customer_name, created_at').order('created_at', { ascending: false }).limit(5);
  if (casesErr) console.error("Error fetching cases:", casesErr);
  else console.log(cases);
}

checkDb();
