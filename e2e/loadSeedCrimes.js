const fs = require('fs');
const path = require('path');

function getSeedCrimes() {
  const seedFile = path.resolve(__dirname, '../server/config/seed.js');
  const content = fs.readFileSync(seedFile, 'utf8');
  const startMarker = 'const crimesData = [';
  const endMarker = 'for (let crime of crimesData)';
  
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  
  if (start === -1 || end === -1) {
    throw new Error('Could not locate crimesData in seed.js');
  }
  
  const arrayString = content.substring(start + 'const crimesData = '.length, end).trim();
  // Safe evaluation in function closure
  const fn = new Function(`return ${arrayString}`);
  const crimes = fn();
  
  // Assign dummy _id and timestamps to match Mongoose schema
  return crimes.map((c, i) => ({
    ...c,
    _id: `crime_${i + 1}_${c.slug}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}

module.exports = { getSeedCrimes };

