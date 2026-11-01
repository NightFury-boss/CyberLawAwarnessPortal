const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const QuizQuestion = require('../models/QuizQuestion');

async function enrichLegalReferences() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);

  const questions = await QuizQuestion.find({});
  console.log(`Processing ${questions.length} questions...`);

  let updatedCount = 0;

  for (const q of questions) {
    let changed = false;
    let refs = Array.isArray(q.legalReferences) ? [...q.legalReferences] : [];

    // 1. If legalReferences is empty, derive from relatedLawSection or category
    if (refs.length === 0) {
      const related = (q.relatedLawSection || '').trim();

      if (related) {
        // e.g. "Section 66D", "Section 43A", "BNS Section 318(4)", "BSA Section 63"
        if (related.toLowerCase().includes('bns')) {
          const match = related.match(/\d+(\(\w+\))?/);
          refs.push({ actName: 'Bharatiya Nyaya Sanhita, 2023', sectionNumber: match ? match[0] : related });
        } else if (related.toLowerCase().includes('bsa')) {
          const match = related.match(/\d+/);
          refs.push({ actName: 'Bharatiya Sakshya Adhiniyam, 2023', sectionNumber: match ? match[0] : related });
        } else if (related.toLowerCase().includes('dpdp')) {
          const match = related.match(/\d+/);
          refs.push({ actName: 'Digital Personal Data Protection Act, 2023', sectionNumber: match ? match[0] : related });
        } else {
          // Assume IT Act 2000
          const sec = related.replace(/^section\s*/i, '').trim();
          refs.push({ actName: 'Information Technology Act, 2000', sectionNumber: sec || '66D' });
        }
        changed = true;
      } else {
        // Fallback by category
        const cat = q.category || '';
        if (cat.includes('Phishing') || cat.includes('Social Engineering')) {
          refs.push({ actName: 'Information Technology Act, 2000', sectionNumber: '66D' });
          if (!q.relatedLawSection) q.relatedLawSection = 'IT Act Section 66D';
          changed = true;
        } else if (cat.includes('Financial') || cat.includes('UPI')) {
          refs.push({ actName: 'Information Technology Act, 2000', sectionNumber: '66D' });
          refs.push({ actName: 'Bharatiya Nyaya Sanhita, 2023', sectionNumber: '318(4)' });
          if (!q.relatedLawSection) q.relatedLawSection = 'BNS Section 318(4) & IT Act 66D';
          changed = true;
        } else if (cat.includes('Account Security') || cat.includes('Identity theft')) {
          refs.push({ actName: 'Information Technology Act, 2000', sectionNumber: '66C' });
          if (!q.relatedLawSection) q.relatedLawSection = 'IT Act Section 66C';
          changed = true;
        } else if (cat.includes('Incident response')) {
          refs.push({ actName: 'Information Technology Act, 2000', sectionNumber: '70B' });
          if (!q.relatedLawSection) q.relatedLawSection = 'IT Act Section 70B & Helpline 1930';
          changed = true;
        } else if (cat.includes('AI') || cat.includes('deepfakes')) {
          refs.push({ actName: 'Information Technology Act, 2000', sectionNumber: '66D' });
          refs.push({ actName: 'Bharatiya Nyaya Sanhita, 2023', sectionNumber: '319' });
          if (!q.relatedLawSection) q.relatedLawSection = 'BNS Section 319 & IT Act 66D';
          changed = true;
        } else {
          refs.push({ actName: 'Information Technology Act, 2000', sectionNumber: '43' });
          if (!q.relatedLawSection) q.relatedLawSection = 'IT Act Section 43';
          changed = true;
        }
      }
    }

    if (changed) {
      q.legalReferences = refs;
      await q.save();
      updatedCount++;
    }
  }

  console.log(`Enrichment complete. Updated ${updatedCount} questions with structured legalReferences.`);
  await mongoose.disconnect();
}

enrichLegalReferences().catch(err => {
  console.error('Enrichment failed:', err);
  process.exit(1);
});
