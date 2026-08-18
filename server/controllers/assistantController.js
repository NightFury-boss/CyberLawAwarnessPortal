const LawSection = require('../models/LawSection');
const CyberCrime = require('../models/CyberCrime');
const CaseStudy = require('../models/CaseStudy');
const Resource = require('../models/Resource');

exports.askAssistant = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const query = message.toLowerCase();

    // Matching regex
    const regex = new RegExp(query.split(' ').filter(w => w.length > 3).join('|') || query, 'i');

    const matchedLaws = await LawSection.find({
      $or: [
        { sectionNumber: regex },
        { title: regex },
        { plainLanguageExplanation: regex }
      ]
    });

    const matchedCrimes = await CyberCrime.find({
      $or: [
        { title: regex },
        { category: regex },
        { whatIsIt: regex }
      ]
    });

    const matchedCases = await CaseStudy.find({
      $or: [
        { title: regex },
        { incidentType: regex },
        { incidentDescription: regex }
      ]
    });

    const matchedResources = await Resource.find({
      $or: [
        { title: regex },
        { category: regex }
      ]
    });

    // Build response text
    let reply = '';
    
    if (matchedLaws.length > 0 || matchedCrimes.length > 0 || matchedCases.length > 0 || matchedResources.length > 0) {
      reply += `Based on the Cyber Law Awareness Portal's database, I found information related to your query:\n\n`;

      if (matchedCrimes.length > 0) {
        reply += `### 🔒 Cybercrime Topics:\n`;
        matchedCrimes.forEach(c => {
          reply += `- **${c.title}**: ${c.whatIsIt}\n`;
        });
        reply += `\n`;
      }

      if (matchedLaws.length > 0) {
        reply += `### ⚖️ Relevant IT Act Sections:\n`;
        matchedLaws.forEach(l => {
          reply += `- **${l.sectionNumber}: ${l.officialTitle}** (${l.legalStatus === 'omitted' ? '⚠️ OMITTED' : 'Active'})\n`;
          reply += `  * *Explanation:* ${l.plainLanguageExplanation}\n`;
        });
        reply += `\n`;
      }

      if (matchedCases.length > 0) {
        reply += `### 🔍 Connected Case Studies:\n`;
        matchedCases.forEach(cs => {
          reply += `- **${cs.title}** (${cs.incidentType}): ${cs.incidentDescription.substring(0, 150)}...\n`;
        });
        reply += `\n`;
      }

      if (matchedResources.length > 0) {
        reply += `### 📞 Official Helplines & Links:\n`;
        matchedResources.forEach(r => {
          reply += `- **${r.title}** (${r.category}): [Link](${r.link}) - ${r.description}\n`;
        });
        reply += `\n`;
      }
    } else {
      reply += `I couldn't find a specific IT Act section or cybercrime category matching those terms.\n\n`;
      reply += `You can ask me questions about:\n`;
      reply += `- **Phishing** and **Identity Theft** (under Section 66C and 66D)\n`;
      reply += `- **UPI & QR Code fraud**\n`;
      reply += `- **Data Protection** obligations (under Section 43A)\n`;
      reply += `- **Official Reporting channels** like the 1930 Helpline.\n\n`;
      reply += `Try typing: *"What is Section 66D?"* or *"Tell me about UPI fraud."*\n\n`;
    }

    reply += `\n---\n`;
    reply += `📢 **How to Report a Cybercrime in India:**\n`;
    reply += `- **Financial Fraud:** Call the National Cybercrime Helpline immediately at **1930** to freeze stolen funds, or file a complaint on the official portal: https://cybercrime.gov.in\n`;
    reply += `- **General Cybercrime:** File a digital complaint at the nearest Cyber Cell or online at https://cybercrime.gov.in\n\n`;
    
    // Legal disclaimer
    reply += `⚠️ *Disclaimer: This information is for educational awareness purposes only and does not constitute formal legal advice. Please refer to official government gazettes or consult a legal practitioner for official counsel.*`;

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: 'Error processing query', error: error.message });
  }
};
