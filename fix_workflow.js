const fs = require('fs');
let content = fs.readFileSync('supabase/functions/workflow/index.ts', 'utf8');

// The lines we want to change are ONLY those that query the `cases` table for `case_id`.
// Specifically:
// .from("cases").select("*").eq("case_id", body.caseId) -> .eq("id", body.caseId)
// .from("cases").update(...).eq("case_id", ...) -> .eq("id", ...)
// .from("cases").delete().eq("case_id", ...) -> .eq("id", ...)

// Safest way is a regex that matches .from("cases") ... .eq("case_id", ...)
// But since the queries can span multiple lines, let's just do manual string replacements for the known patterns in workflow/index.ts

const replacements = [
  { from: '.eq("case_id", body.caseId)', to: '.eq("id", body.caseId)' },
  { from: '.eq("case_id", trackingId)', to: '.eq("id", trackingId)' },
  { from: '.eq("case_id", newCase.case_id)', to: '.eq("id", newCase.id)' },
  { from: 'case_id.ilike', to: 'id.ilike' },
  { from: '.select("case_id, tracking_id, current_stage, status")', to: '.select("id, tracking_id, current_stage, status")' },
  { from: '.select("case_id, current_stage")', to: '.select("id, current_stage")' },
  { from: 'case_id: data.case_id,', to: 'case_id: data.id,' },
  { from: 'tracking_id: data.tracking_id || data.case_id,', to: 'tracking_id: data.tracking_id || data.id,' },
  { from: 'case_id: newCase.case_id,', to: 'case_id: newCase.id,' },
  { from: '${newCase.case_id}', to: '${newCase.id}' },
  { from: 'caseId       = newCase.case_id', to: 'caseId       = newCase.id' },
  { from: 'case_id:        caseObj.case_id,', to: 'case_id:        caseObj.id,' },
  { from: 'case_id: caseObj.case_id,', to: 'case_id: caseObj.id,' },
  { from: 'eq("case_id", caseId)', to: 'eq("id", caseId)' }
];

let newContent = content;
for (const r of replacements) {
  // we want to replace globally if needed, except case_id in history which we don't touch
  newContent = newContent.split(r.from).join(r.to);
}

// Ensure case_history and case_comments still use case_id as column name
// Example: .from("case_history").delete().eq("id", body.caseId); wait!
// If I replaced `.eq("case_id", body.caseId)` with `.eq("id", body.caseId)` globally, 
// then .from("case_history").delete().eq("case_id", body.caseId) became .eq("id", body.caseId), WHICH IS WRONG!

// Let's restore case_history and case_comments to use case_id
newContent = newContent.replace(/\.from\("case_history"\)\n\s*\.select\("\*"\)\n\s*\.eq\("id", body\.caseId\)/g, '.from("case_history")\n        .select("*")\n        .eq("case_id", body.caseId)');
newContent = newContent.replace(/\.from\("case_comments"\)\n\s*\.select\("\*"\)\n\s*\.eq\("id", body\.caseId\)/g, '.from("case_comments")\n        .select("*")\n        .eq("case_id", body.caseId)');
newContent = newContent.replace(/\.from\("case_history"\)\.delete\(\)\.eq\("id", body\.caseId\)/g, '.from("case_history").delete().eq("case_id", body.caseId)');
newContent = newContent.replace(/\.from\("case_comments"\)\.delete\(\)\.eq\("id", body\.caseId\)/g, '.from("case_comments").delete().eq("case_id", body.caseId)');

fs.writeFileSync('supabase/functions/workflow/index.ts', newContent);
console.log('Fixed workflow/index.ts');
