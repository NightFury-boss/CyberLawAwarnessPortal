const fs = require('fs');

// 1. Modules.jsx
let modules = fs.readFileSync('client/src/pages/Modules.jsx', 'utf8');
modules = modules.replace(/#059669\b/gi, 'var(--color-success, #536F61)');
modules = modules.replace(/#10b981\b/gi, 'var(--color-success, #536F61)');
modules = modules.replace(/#b45309\b/gi, 'var(--color-warning, #B17A38)');
modules = modules.replace(/#2563eb\b/gi, 'var(--color-accent-terracotta, #A65F45)');
modules = modules.replace(/#ffffff\b/gi, 'var(--color-surface-card, #FCFAF5)');
modules = modules.replace(/#f8fafc\b/gi, 'var(--color-surface-secondary, #EFE8DC)');
modules = modules.replace(/#fafaf9\b/gi, 'var(--color-surface-secondary, #EFE8DC)');
modules = modules.replace(/#e2e8f0\b/gi, 'var(--color-border, #DED6C9)');
modules = modules.replace(/#e7e5e4\b/gi, 'var(--color-border, #DED6C9)');
modules = modules.replace(/#ecfdf5\b/gi, 'var(--color-success-light, #EEF4F0)');
modules = modules.replace(/#fef2f2\b/gi, 'var(--color-danger-light, #F9ECEB)');
fs.writeFileSync('client/src/pages/Modules.jsx', modules, 'utf8');
console.log('Updated Modules.jsx');

// 2. Quizzes.jsx
let quizzes = fs.readFileSync('client/src/pages/Quizzes.jsx', 'utf8');
quizzes = quizzes.replace(/activeTab === 'modes' \? '3px solid #1e3a8a'/g, "activeTab === 'modes' ? '3px solid var(--color-accent-terracotta, #A65F45)'");
quizzes = quizzes.replace(/activeTab === 'modes' \? '#1e3a8a'/g, "activeTab === 'modes' ? 'var(--color-accent-terracotta, #A65F45)'");
quizzes = quizzes.replace(/activeTab === 'catalog' \? '3px solid #1e3a8a'/g, "activeTab === 'catalog' ? '3px solid var(--color-accent-terracotta, #A65F45)'");
quizzes = quizzes.replace(/activeTab === 'catalog' \? '#1e3a8a'/g, "activeTab === 'catalog' ? 'var(--color-accent-terracotta, #A65F45)'");
quizzes = quizzes.replace(/#1e3a8a\b/gi, 'var(--color-text-primary, #302B27)');
quizzes = quizzes.replace(/#f8fafc\b/gi, 'var(--color-surface-secondary, #EFE8DC)');
quizzes = quizzes.replace(/#eff6ff\b/gi, 'var(--color-gold-light, #FAF4EA)');
quizzes = quizzes.replace(/#16a34a\b/gi, 'var(--color-success, #536F61)');
quizzes = quizzes.replace(/#22c55e\b/gi, 'var(--color-success, #536F61)');
quizzes = quizzes.replace(/#ea580c\b/gi, 'var(--color-accent-terracotta, #A65F45)');
quizzes = quizzes.replace(/#2563eb\b/gi, 'var(--color-accent-terracotta, #A65F45)');
fs.writeFileSync('client/src/pages/Quizzes.jsx', quizzes, 'utf8');
console.log('Updated Quizzes.jsx');

// 3. Navbar.jsx
let navbar = fs.readFileSync('client/src/components/Navbar.jsx', 'utf8');
navbar = navbar.replace(/#0a192f\b/gi, 'var(--color-text-primary, #302B27)');
navbar = navbar.replace(/#1e3a8a\b/gi, 'var(--color-accent-gold, #B18A55)');
fs.writeFileSync('client/src/components/Navbar.jsx', navbar, 'utf8');
console.log('Updated Navbar.jsx');

