const fs = require('fs');

const files = [
  'client/src/pages/BaselineAssessment.jsx',
  'client/src/pages/FinalAssessment.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/#0f2537\b/gi, 'var(--color-text-primary, #302B27)');
  content = content.replace(/backgroundColor:\s*['"]#fff['"]/gi, "backgroundColor: 'var(--color-surface-card, #FCFAF5)'");
  content = content.replace(/color:\s*['"]#fff['"]/gi, "color: '#FCFAF5'");
  content = content.replace(/#f0f4f8\b/gi, 'var(--color-surface-secondary, #EFE8DC)');
  content = content.replace(/#f1f5f9\b/gi, 'var(--color-surface-secondary, #EFE8DC)');
  content = content.replace(/#f8fafc\b/gi, 'var(--color-surface-secondary, #EFE8DC)');
  content = content.replace(/#1e3a8a\b/gi, 'var(--color-text-primary, #302B27)');
  content = content.replace(/#16a34a\b/gi, 'var(--color-success, #536F61)');
  content = content.replace(/#22c55e\b/gi, 'var(--color-success, #536F61)');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ' + file);
});

