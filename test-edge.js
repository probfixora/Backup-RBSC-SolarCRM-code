const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function test() {
  const url = process.env.VITE_SUPABASE_URL + '/functions/v1/workflow';
  console.log("Fetching", url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Provide a dummy token just to see the error. Or we can just send no token.
      },
      body: JSON.stringify({ action: "get_all", limit: 100, offset: 0 })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch(e) {
    console.error(e);
  }
}
test();
