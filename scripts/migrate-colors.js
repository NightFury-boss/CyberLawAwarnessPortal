const fs = require('fs');

function migratePathwayRunner() {
  const p = 'client/src/components/PathwayRunner.jsx';
  let content = fs.readFileSync(p, 'utf8');

  const replacements = [
    [/var\(--bg-white, #ffffff\)/g, 'var(--color-surface-card, #FFFDFA)'],
    [/var\(--bg-secondary, #(?:f4f3ee|fafaf9)\)/g, 'var(--color-surface-secondary, #EEE7DB)'],
    [/var\(--color-primary-light, #f0f4f8\)/g, 'var(--color-surface-secondary, #EEE7DB)'],
    [/'#b45309'/g, "'var(--color-warning, #B17A38)'"],
    [/'#92400e'/g, "'var(--color-warning, #B17A38)'"],
    [/'#065f46'/g, "'var(--color-success, #536F61)'"],
    [/'#047857'/g, "'var(--color-success, #536F61)'"],
    [/'#166534'/g, "'var(--color-success, #536F61)'"],
    [/'#991b1b'/g, "'var(--color-danger, #A34D43)'"],
    [/'#64748b'/g, "'var(--color-text-muted, #797066)'"],
    [/'#f8fafc'/g, "'var(--color-surface-secondary, #EEE7DB)'"],
    [/'#fef2f2'/g, "'var(--color-danger-light, #F9ECEB)'"],
    [/'#ecfdf5'/g, "'var(--color-success-light, #EEF4F0)'"],
    [/'#f0fdf4'/g, "'var(--color-success-light, #EEF4F0)'"],
    [/'#fffbeb'/g, "'var(--color-warning-light, #FAF3E8)'"],
    [/'#10b981'/g, "'var(--color-success, #536F61)'"],
    [/'#86efac'/g, "'var(--color-border, #DED6C9)'"],
    [/'#ef4444'/g, "'var(--color-danger, #A34D43)'"],
    [/'#f59e0b'/g, "'var(--color-warning, #B17A38)'"]
  ];

  replacements.forEach(([re, rep]) => {
    content = content.replace(re, rep);
  });

  fs.writeFileSync(p, content, 'utf8');
  console.log('Migrated PathwayRunner.jsx');
}

function migrateRemediationCards() {
  const p = 'client/src/components/RemediationCards.jsx';
  let content = fs.readFileSync(p, 'utf8');

  const replacements = [
    // Informational card badge
    [/'#1e3a8a'/g, "'var(--color-accent-terracotta, #A65F45)'"],
    [/'#eff6ff'/g, "'var(--color-terracotta-light, #FAF1ED)'"],
    [/'#bfdbfe'/g, "'var(--color-border, #DED6C9)'"],
    // Success badge
    [/'#065f46'/g, "'var(--color-success, #536F61)'"],
    [/'#ecfdf5'/g, "'var(--color-success-light, #EEF4F0)'"],
    [/'#a7f3d0'/g, "'var(--color-border, #DED6C9)'"],
    // Warning badge
    [/'#92400e'/g, "'var(--color-warning, #B17A38)'"],
    [/'#fffbeb'/g, "'var(--color-warning-light, #FAF3E8)'"],
    [/'#fef3c7'/g, "'var(--color-warning-light, #FAF3E8)'"],
    [/'#fde68a'/g, "'var(--color-border, #DED6C9)'"],
    [/'#b45309'/g, "'var(--color-warning, #B17A38)'"]
  ];

  replacements.forEach(([re, rep]) => {
    content = content.replace(re, rep);
  });

  fs.writeFileSync(p, content, 'utf8');
  console.log('Migrated RemediationCards.jsx');
}

function migrateQuizzes() {
  const p = 'client/src/pages/Quizzes.jsx';
  let content = fs.readFileSync(p, 'utf8');

  const replacements = [
    [/'#fffbeb'/g, "'var(--color-warning-light, #FAF3E8)'"],
    [/'#fef3c7'/g, "'var(--color-border, #DED6C9)'"],
    [/'#f59e0b'/g, "'var(--color-warning, #B17A38)'"],
    [/'#92400e'/g, "'var(--color-warning, #B17A38)'"],
    [/'#b45309'/g, "'var(--color-warning, #B17A38)'"],
    [/'#e2e8f0'/g, "'var(--color-border, #DED6C9)'"],
    [/'#cbd5e1'/g, "'var(--color-border, #DED6C9)'"],
    [/'#64748b'/g, "'var(--color-text-muted, #797066)'"],
    [/'#1e293b'/g, "'var(--color-text-primary, #302B27)'"],
    [/'#ffffff'/g, "'var(--color-surface-card, #FFFDFA)'"],
    [/'#fef2f2'/g, "'var(--color-danger-light, #F9ECEB)'"],
    [/'#fee2e2'/g, "'var(--color-border, #DED6C9)'"],
    [/'#ef4444'/g, "'var(--color-danger, #A34D43)'"],
    [/'#dc2626'/g, "'var(--color-danger, #A34D43)'"],
    [/'#991b1b'/g, "'var(--color-danger, #A34D43)'"],
    [/'#f0fdf4'/g, "'var(--color-success-light, #EEF4F0)'"],
    [/'#86efac'/g, "'var(--color-success, #536F61)'"],
    [/'#166534'/g, "'var(--color-success, #536F61)'"],
    [/'#fff7ed'/g, "'var(--color-danger-light, #F9ECEB)'"],
    [/'#fdba74'/g, "'var(--color-danger, #A34D43)'"],
    [/'#9a3412'/g, "'var(--color-danger, #A34D43)'"]
  ];

  replacements.forEach(([re, rep]) => {
    content = content.replace(re, rep);
  });

  fs.writeFileSync(p, content, 'utf8');
  console.log('Migrated Quizzes.jsx');
}

function migrateAdminPanel() {
  const p = 'client/src/pages/AdminPanel.jsx';
  let content = fs.readFileSync(p, 'utf8');

  const replacements = [
    [/bg: '#dbeafe'/g, "bg: 'var(--color-terracotta-light, #FAF1ED)'"],
    [/color: '#0f766e', bg: '#ccfbf1', border: '#99f6e4'/g, "color: 'var(--color-success, #536F61)', bg: 'var(--color-success-light, #EEF4F0)', border: 'var(--color-border, #DED6C9)'"],
    [/color: '#374151', bg: '#f3f4f6', border: '#e5e7eb'/g, "color: 'var(--color-text-secondary, #635B53)', bg: 'var(--color-surface-secondary, #EEE7DB)', border: 'var(--color-border, #DED6C9)'"],
    [/border: '1px solid #bbf7d0'/g, "border: '1px solid var(--color-border, #DED6C9)'"],
    [/color: '#93c5fd'/g, "color: 'var(--color-accent-gold, #B18A55)'"],
    [/color: '#94a3b8'/g, "color: 'var(--color-text-muted, #797066)'"],
    [/color: '#475569'/g, "color: 'var(--color-text-secondary, #635B53)'"],
    [/color: '#64748b'/g, "color: 'var(--color-text-muted, #797066)'"],
    [/backgroundColor: '#e0e7ff', color: '#3730a3'/g, "backgroundColor: 'var(--color-gold-light, #FAF4EA)', color: 'var(--color-accent-terracotta, #A65F45)'"],
    [/backgroundColor: '#fff'/g, "backgroundColor: 'var(--color-surface-card, #FFFDFA)'"],
    [/backgroundColor: '#faf9f5'/g, "backgroundColor: 'var(--color-surface-secondary, #EEE7DB)'"]
  ];

  replacements.forEach(([re, rep]) => {
    content = content.replace(re, rep);
  });

  fs.writeFileSync(p, content, 'utf8');
  console.log('Migrated AdminPanel.jsx');
}

function migrateMainCssSpaced() {
  const p = 'client/src/styles/main.css';
  let content = fs.readFileSync(p, 'utf8');

  const replacements = [
    // Spaced modal
    [/color: #1e3a8a;/g, 'color: var(--color-accent-terracotta, #A65F45);'],
    [/color: #0f172a;/g, 'color: var(--color-text-primary, #302B27);'],
    [/color: #334155;/g, 'color: var(--color-text-secondary, #635B53);'],
    [/color: #475569;/g, 'color: var(--color-text-secondary, #635B53);'],
    [/color: #64748b;/g, 'color: var(--color-text-muted, #797066);'],
    [/color: #1e293b;/g, 'color: var(--color-text-primary, #302B27);'],
    [/background-color: #f8fafc;/g, 'background-color: var(--color-surface-secondary, #EEE7DB);'],
    [/background: #f8fafc;/g, 'background: var(--color-surface-secondary, #EEE7DB);'],
    [/border: 1px solid #e2e8f0;/g, 'border: 1px solid var(--color-border, #DED6C9);'],
    [/border-bottom: 1px solid #e2e8f0;/g, 'border-bottom: 1px solid var(--color-border, #DED6C9);'],
    [/border-top: 1px solid #e2e8f0;/g, 'border-top: 1px solid var(--color-border, #DED6C9);'],
    [/border-left: 4px solid #1e3a8a;/g, 'border-left: 4px solid var(--color-accent-terracotta, #A65F45);'],
    [/border-left: 3px solid #1e3a8a;/g, 'border-left: 3px solid var(--color-accent-terracotta, #A65F45);'],
    [/outline: 2px solid #1e3a8a;/g, 'outline: 2px solid var(--color-accent-gold, #B18A55);'],
    [/border-color: #1e3a8a !important;/g, 'border-color: var(--color-accent-gold, #B18A55) !important;'],
    [/background-color: #1e3a8a !important;/g, 'background-color: var(--color-text-primary, #302B27) !important;'],
    [/background-color: #172554 !important;/g, 'background-color: #423C37 !important;'],
    [/border-color: #172554 !important;/g, 'border-color: #423C37 !important;'],
    [/background: #f0f7ff;/g, 'background: var(--color-surface-card, #FFFDFA);'],
    [/border: 1px solid #bfdbfe;/g, 'border: 1px solid var(--color-border, #DED6C9);'],
    [/color: #15803d;/g, 'color: var(--color-success, #536F61);'],
    [/color: #b45309;/g, 'color: var(--color-warning, #B17A38);'],
    [/color: #b91c1c;/g, 'color: var(--color-danger, #A34D43);'],
    [/background-color: #f0fdf4;/g, 'background-color: var(--color-success-light, #EEF4F0);'],
    [/background-color: #dcfce7;/g, 'background-color: var(--color-success-light, #EEF4F0);'],
    [/border: 1px solid #bbf7d0;/g, 'border: 1px solid var(--color-border, #DED6C9);'],
    [/border-left: 4px solid #16a34a;/g, 'border-left: 4px solid var(--color-success, #536F61);'],
    [/background-color: #fee2e2;/g, 'background-color: var(--color-danger-light, #F9ECEB);'],
    [/border-left: 4px solid #dc2626;/g, 'border-left: 4px solid var(--color-danger, #A34D43);']
  ];

  replacements.forEach(([re, rep]) => {
    content = content.replace(re, rep);
  });

  fs.writeFileSync(p, content, 'utf8');
  console.log('Migrated main.css legacy spaced styles');
}

migratePathwayRunner();
migrateRemediationCards();
migrateQuizzes();
migrateAdminPanel();
migrateMainCssSpaced();
console.log('All migrations completed.');

