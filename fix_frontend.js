const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('frontend/src', function(filePath) {
  if (filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    content = content.replace(/c\.case_id \?\? c\.caseId/g, 'c.id ?? c.case_id ?? c.caseId');
    content = content.replace(/c\.case_id\s*\|\|\s*c\.caseId/g, 'c.id || c.case_id || c.caseId');
    content = content.replace(/caseData\?\.case_id \?\? caseData\?\.caseId/g, 'caseData?.id ?? caseData?.case_id ?? caseData?.caseId');
    content = content.replace(/caseData\?\.case_id \|\| caseData\?\.caseId/g, 'caseData?.id || caseData?.case_id || caseData?.caseId');
    content = content.replace(/caseData\.case_id \|\| caseData\.caseId/g, 'caseData.id || caseData.case_id || caseData.caseId');
    content = content.replace(/n\.case_id \|\| n\.caseId/g, 'n.id || n.case_id || n.caseId');
    content = content.replace(/a\.caseId \|\| a\.case_id/g, 'a.caseId || a.id || a.case_id');
    content = content.replace(/result\.tracking_id \|\| result\.case_id/g, 'result.tracking_id || result.id || result.case_id');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log('Fixed ' + filePath);
    }
  }
});
