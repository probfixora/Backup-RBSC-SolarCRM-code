import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// read .env file manually
const envPath = path.resolve('.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || envVars.SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCases() {
  const { data, error } = await supabase
    .from('cases')
    .select('id, customer_name, current_stage, assigned_team, assigned_to')
    .eq('current_stage', 'Final Payment Collection');
    
  if (error) console.error(error);
  console.log('Cases in Final Payment Collection:', data);
  
  for (const c of data) {
    const { data: history } = await supabase
      .from('case_history')
      .select('id, stage, action_type, updated_by, timestamp, created_at')
      .eq('case_id', c.id)
      .eq('stage', 'Bank & Finance');
    console.log(`History for case ${c.id}:`, history);
  }
}

checkCases();
