import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanInventory() {
  console.log("Cleaning up all dummy inventory items except user's item...");
  
  // Delete everything that is NOT the user's item
  const { data, error } = await supabase
    .from('inventory')
    .delete()
    .neq('name', 'Solar panal');

  if (error) {
    console.error("Error deleting items:", error);
  } else {
    console.log("Successfully deleted all dummy items.");
  }
}

cleanInventory();
