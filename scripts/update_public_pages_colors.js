const fs = require('fs');

// Crimes.jsx
let crimes = fs.readFileSync('client/src/pages/Crimes.jsx', 'utf8');
crimes = crimes.replace(/#2563eb\b/gi, 'var(--color-accent-terracotta, #A65F45)');
crimes = crimes.replace(/#1d4ed8\b/gi, 'var(--color-accent-gold, #B18A55)');
crimes = crimes.replace(/#1a6234\b/gi, 'var(--color-success, #536F61)');
crimes = crimes.replace(/#7b1c12\b/gi, 'var(--color-danger, #A34D43)');
fs.writeFileSync('client/src/pages/Crimes.jsx', crimes, 'utf8');
console.log('Updated Crimes.jsx');

// Cases.jsx
let cases = fs.readFileSync('client/src/pages/Cases.jsx', 'utf8');
cases = cases.replace(/#2563eb\b/gi, 'var(--color-accent-terracotta, #A65F45)');
cases = cases.replace(/#3b82f6\b/gi, 'var(--color-accent-gold, #B18A55)');
cases = cases.replace(/#10b981\b/gi, 'var(--color-success, #536F61)');
cases = cases.replace(/#ef4444\b/gi, 'var(--color-danger, #A34D43)');
cases = cases.replace(/var\(--bg-white,\s*#ffffff\)/g, 'var(--color-surface-card, #FCFAF5)');
fs.writeFileSync('client/src/pages/Cases.jsx', cases, 'utf8');
console.log('Updated Cases.jsx');

// Prevention.jsx
let prevention = fs.readFileSync('client/src/pages/Prevention.jsx', 'utf8');
prevention = prevention.replace(/rgba\(15,\s*37,\s*55,/g, 'rgba(48, 43, 39,');
prevention = prevention.replace(/var\(--bg-white,\s*#ffffff\)/g, 'var(--color-surface-card, #FCFAF5)');
prevention = prevention.replace(/#dc2626\b/gi, 'var(--color-danger, #A34D43)');
prevention = prevention.replace(/#b91c1c\b/gi, 'var(--color-danger, #A34D43)');
prevention = prevention.replace(/#7b1c12\b/gi, 'var(--color-danger, #A34D43)');
fs.writeFileSync('client/src/pages/Prevention.jsx', prevention, 'utf8');
console.log('Updated Prevention.jsx');

// Laws.jsx
let laws = fs.readFileSync('client/src/pages/Laws.jsx', 'utf8');
laws = laws.replace(/var\(--bg-card,\s*#ffffff\)/g, 'var(--color-surface-card, #FCFAF5)');
laws = laws.replace(/var\(--accent-navy,\s*#1e3a8a\)/g, 'var(--color-text-primary, #302B27)');
laws = laws.replace(/#10b981\b/gi, 'var(--color-success, #536F61)');
laws = laws.replace(/#3b82f6\b/gi, 'var(--color-accent-gold, #B18A55)');
laws = laws.replace(/#ef4444\b/gi, 'var(--color-danger, #A34D43)');
fs.writeFileSync('client/src/pages/Laws.jsx', laws, 'utf8');
console.log('Updated Laws.jsx');

