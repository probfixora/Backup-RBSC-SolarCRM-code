const fs = require('fs');
let c = fs.readFileSync('supabase/functions/quotation/index.ts', 'utf8');

// Pattern: || "${Deno.env.get("KEY") || "DEFAULT"}"  →  || "DEFAULT"
// In a template literal context: || "${...}"  →  || "DEFAULT"
// The nested pattern has: "...${ Deno.env.get("KEY") || "DEFAULT" }"
// We need to find all occurrences and fix them

// The bad pattern is: || "${Deno.env.get("X") || "Y"}"  where it's inside a template literal already
// So the outer quote and the inner quotes clash

// Fix: replace  "${Deno.env.get("KEY") || "FALLBACK"}"  with just the Deno expression properly
// These are: inside a template literal string (``), someone accidentally put the pattern twice

// The pattern we see is: || "${Deno.env.get("
// Find all matches of this broken pattern
const regex = /"\$\{Deno\.env\.get\("([^"]+)"\) \|\| "([^"]+)"\}"/g;

let count = 0;
c = c.replace(regex, (match, key, fallback) => {
  count++;
  console.log(`Fixing: ${match.substring(0, 60)}`);
  // Replace with just the fallback string  
  return `"${fallback}"`;
});

console.log(`Fixed ${count} occurrences`);
fs.writeFileSync('supabase/functions/quotation/index.ts', c);
console.log('Done');
