const fs = require('fs');
const path = require('path');

const envPath = path.resolve('.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
  }
});

const url = envVars.VITE_EDGE_WORKFLOW || (envVars.SUPABASE_URL + '/functions/v1/workflow');

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'backfill_banking' })
}).then(res => res.json()).then(data => console.log(data)).catch(console.error);
