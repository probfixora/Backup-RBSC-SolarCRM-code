const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, 'supabase', 'functions', 'workflow', 'index.ts');
const quotationPath = path.join(__dirname, 'supabase', 'functions', 'quotation', 'index.ts');

const workflowCode = fs.readFileSync(workflowPath, 'utf8');
const quotationCode = fs.readFileSync(quotationPath, 'utf8');

const emailRegex = /\/\/ ── SEND REGISTRATION CONFIRMATION EMAIL ──────────────────────────────([\s\S]*?)\/\/ ─────────────────────────────────────────────────────────────────────/m;
const match = workflowCode.match(emailRegex);

if (!match) {
  console.error("Email block not found in workflow/index.ts");
  process.exit(1);
}

const emailBlock = match[0];

const targetPattern = /if \(updErr\) return jsonResponse\(\{ message: `Quotation update failed: \$\{updErr.message\}` \}, 400\);/m;

if (!targetPattern.test(quotationCode)) {
  console.error("Target pattern not found in quotation/index.ts");
  process.exit(1);
}

const updatedQuotationCode = quotationCode.replace(
  targetPattern,
  `if (updErr) return jsonResponse({ message: \`Quotation update failed: \${updErr.message}\` }, 400);\n\n      ${emailBlock}\n`
);

fs.writeFileSync(quotationPath, updatedQuotationCode, 'utf8');
console.log("Successfully injected email block into quotation/index.ts");
