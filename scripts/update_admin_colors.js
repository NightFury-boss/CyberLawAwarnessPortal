const fs = require('fs');

let admin = fs.readFileSync('client/src/pages/AdminPanel.jsx', 'utf8');
admin = admin.replace(/#0a192f\b/gi, 'var(--color-text-primary, #302B27)');
admin = admin.replace(/#1e3a8a\b/gi, 'var(--color-text-primary, #302B27)');
admin = admin.replace(/#0f172a\b/gi, 'var(--color-text-primary, #302B27)');
admin = admin.replace(/#1e293b\b/gi, 'var(--color-surface-secondary, #EFE8DC)');
admin = admin.replace(/#1e40af\b/gi, 'var(--color-accent-terracotta, #A65F45)');
admin = admin.replace(/#2563eb\b/gi, 'var(--color-accent-terracotta, #A65F45)');
admin = admin.replace(/#3b82f6\b/gi, 'var(--color-accent-gold, #B18A55)');
admin = admin.replace(/#065f46\b/gi, 'var(--color-success, #536F61)');
admin = admin.replace(/#166534\b/gi, 'var(--color-success, #536F61)');
admin = admin.replace(/#15803d\b/gi, 'var(--color-success, #536F61)');
admin = admin.replace(/#22c55e\b/gi, 'var(--color-success, #536F61)');
admin = admin.replace(/#991b1b\b/gi, 'var(--color-danger, #A34D43)');
admin = admin.replace(/#92400e\b/gi, 'var(--color-warning, #B17A38)');
admin = admin.replace(/#d1fae5\b/gi, 'var(--color-success-light, #EEF4F0)');
admin = admin.replace(/#dcfce7\b/gi, 'var(--color-success-light, #EEF4F0)');
admin = admin.replace(/#fee2e2\b/gi, 'var(--color-danger-light, #F9ECEB)');
admin = admin.replace(/#fef3c7\b/gi, 'var(--color-warning-light, #FAF3E8)');
admin = admin.replace(/#eff6ff\b/gi, 'var(--color-gold-light, #FAF4EA)');
admin = admin.replace(/#ffffff\b/gi, 'var(--color-surface-card, #FCFAF5)');
admin = admin.replace(/#f8fafc\b/gi, 'var(--color-surface-secondary, #EFE8DC)');
admin = admin.replace(/#f1f5f9\b/gi, 'var(--color-surface-secondary, #EFE8DC)');
admin = admin.replace(/#e2e8f0\b/gi, 'var(--color-border, #DED6C9)');
admin = admin.replace(/#cbd5e1\b/gi, 'var(--color-border, #DED6C9)');
admin = admin.replace(/#bfdbfe\b/gi, 'var(--color-border, #DED6C9)');
admin = admin.replace(/#a7f3d0\b/gi, 'var(--color-border, #DED6C9)');
admin = admin.replace(/#fecaca\b/gi, 'var(--color-border, #DED6C9)');
admin = admin.replace(/#fde68a\b/gi, 'var(--color-border, #DED6C9)');

fs.writeFileSync('client/src/pages/AdminPanel.jsx', admin, 'utf8');
console.log('Updated AdminPanel.jsx');

