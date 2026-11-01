import fs from 'fs';
import path from 'path';

const files = [
  'client/src/styles/dashboard-reinvention.css',
  'client/src/styles/dashboard-redesign.css',
  'client/src/styles/assessment-quiz.css',
  'client/src/styles/main.css'
];

const replacements = [
  [/#FFFDFA/gi, '#FFFFFF'],
  [/#F6F2EA/gi, '#F8F4EC'],
  [/#EEE7DB/gi, '#EFE5D6'],
  [/#A65F45/gi, '#9A503A'],
  [/#536F61/gi, '#4B6658'],
  [/#B17A38/gi, '#8A5A20'],
  [/#797066/gi, '#6F665D']
];

for (const relPath of files) {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) continue;
  let content = fs.readFileSync(fullPath, 'utf8');
  let count = 0;
  for (const [pattern, replacement] of replacements) {
    const matches = content.match(pattern);
    if (matches) {
      count += matches.length;
      content = content.replace(pattern, replacement);
    }
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${relPath}: ${count} replacements`);
}

