const fs = require('fs');
let content = fs.readFileSync('supabase/functions/workflow/index.ts', 'utf8');

// Replace .eq('case_id', ...) with .eq('id', ...) ONLY FOR CASES TABLE?
// We need to be careful because case_history and case_comments still use case_id as foreign key.
// Actually, in the edge function, the query is often chained.
content = content.replace(/\.eq\("case_id"/g, '.eq("id"');
content = content.replace(/\.select\("case_id/g, '.select("id');
content = content.replace(/newCase\.case_id/g, 'newCase.id');
content = content.replace(/data\.case_id/g, 'data.id');
content = content.replace(/case_id\.ilike/g, 'id.ilike');

fs.writeFileSync('supabase/functions/workflow/index.ts', content);
console.log('Done!');
