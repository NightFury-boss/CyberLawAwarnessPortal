const fs = require('fs');
const path = require('path');

const getMonumentMarkup = (idPrefix, mode = 'light') => {
  const isDark = mode === 'dark';

  return `
  <defs>
    <!-- Roof Right (Gold) -->
    <linearGradient id="${idPrefix}_roofRightSlope" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF0CE" />
      <stop offset="30%" stop-color="#F7CE83" />
      <stop offset="70%" stop-color="#E5A84B" />
      <stop offset="100%" stop-color="#C78729" />
    </linearGradient>
    <linearGradient id="${idPrefix}_roofRightFascia" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCE5B5" />
      <stop offset="40%" stop-color="#E2A244" />
      <stop offset="85%" stop-color="#B86E18" />
      <stop offset="100%" stop-color="#934D09" />
    </linearGradient>

    <!-- Roof Left -->
    <linearGradient id="${idPrefix}_roofLeftSlope" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${isDark ? '#FFFBF5' : '#6B3519'}" />
      <stop offset="40%" stop-color="${isDark ? '#F5E4D1' : '#4E240D'}" />
      <stop offset="100%" stop-color="${isDark ? '#D9BC9E' : '#331505'}" />
    </linearGradient>
    <linearGradient id="${idPrefix}_roofLeftFascia" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${isDark ? '#F5E7D8' : '#56270E'}" />
      <stop offset="60%" stop-color="${isDark ? '#D8B896' : '#391705'}" />
      <stop offset="100%" stop-color="${isDark ? '#B38F69' : '#220B01'}" />
    </linearGradient>

    <!-- Left C Structure -->
    <linearGradient id="${idPrefix}_leftCBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${isDark ? '#FFF9F2' : '#5E2B10'}" />
      <stop offset="45%" stop-color="${isDark ? '#F2DFCB' : '#441D07'}" />
      <stop offset="100%" stop-color="${isDark ? '#D1B08E' : '#290E02'}" />
    </linearGradient>
    <linearGradient id="${idPrefix}_leftCFold" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${isDark ? '#C7A37E' : '#280E02'}" />
      <stop offset="40%" stop-color="${isDark ? '#E8D0B8' : '#54260D'}" />
      <stop offset="80%" stop-color="${isDark ? '#FAF0E4' : '#85421A'}" />
      <stop offset="100%" stop-color="${isDark ? '#FFFFFF' : '#AD5725'}" />
    </linearGradient>
    <linearGradient id="${idPrefix}_leftCutout" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${isDark ? '#7D5C3B' : '#140501'}" />
      <stop offset="100%" stop-color="${isDark ? '#BFA07E' : '#381604'}" />
    </linearGradient>

    <!-- Right L Structure -->
    <linearGradient id="${idPrefix}_colTerracotta" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F58E3E" />
      <stop offset="35%" stop-color="#E2772A" />
      <stop offset="80%" stop-color="#B85112" />
      <stop offset="100%" stop-color="#8A3607" />
    </linearGradient>
    <linearGradient id="${idPrefix}_colGoldMid" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF4DB" />
      <stop offset="30%" stop-color="#FAD796" />
      <stop offset="70%" stop-color="#E8B052" />
      <stop offset="100%" stop-color="#C28122" />
    </linearGradient>
    <linearGradient id="${idPrefix}_colGoldOuter" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFECBF" />
      <stop offset="45%" stop-color="#F6CA7C" />
      <stop offset="85%" stop-color="#D79435" />
      <stop offset="100%" stop-color="#AB6712" />
    </linearGradient>
    <linearGradient id="${idPrefix}_footTier1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FAD796" />
      <stop offset="60%" stop-color="#E8B052" />
      <stop offset="100%" stop-color="#B86E18" />
    </linearGradient>
    <linearGradient id="${idPrefix}_footTier2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E2772A" />
      <stop offset="40%" stop-color="#F6CA7C" />
      <stop offset="80%" stop-color="#D79435" />
      <stop offset="100%" stop-color="#934D09" />
    </linearGradient>

    <!-- Plinths -->
    <linearGradient id="${idPrefix}_plinthLeftUpper" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${isDark ? '#F5E4D1' : '#54280E'}" />
      <stop offset="50%" stop-color="${isDark ? '#D9BC9E' : '#3E1B07'}" />
      <stop offset="100%" stop-color="${isDark ? '#BF9B77' : '#2A1003'}" />
    </linearGradient>
    <linearGradient id="${idPrefix}_plinthLeftLower" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${isDark ? '#E5D0B8' : '#411C06'}" />
      <stop offset="50%" stop-color="${isDark ? '#C7A583' : '#2E1203'}" />
      <stop offset="100%" stop-color="${isDark ? '#A6825E' : '#1A0801'}" />
    </linearGradient>
    <linearGradient id="${idPrefix}_plinthRightUpper" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E27B32" />
      <stop offset="45%" stop-color="#BA5B1E" />
      <stop offset="100%" stop-color="#7A3008" />
    </linearGradient>
    <linearGradient id="${idPrefix}_plinthRightLower" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#BC5E20" />
      <stop offset="45%" stop-color="#964414" />
      <stop offset="100%" stop-color="#622304" />
    </linearGradient>
  </defs>

  <g id="${idPrefix}_emblem_body">
    <!-- Roof Left -->
    <polygon points="149,4 52,60 52,68 149,14" fill="url(#${idPrefix}_roofLeftSlope)" />
    <polygon points="149,14 52,68 52,84 149,34" fill="url(#${idPrefix}_roofLeftFascia)" />
    <line x1="149" y1="4" x2="52" y2="60" stroke="${isDark ? '#FFFDF8' : '#8E4D26'}" stroke-width="1.8" stroke-linecap="round" />
    <line x1="149" y1="14" x2="52" y2="68" stroke="${isDark ? '#FFF7EC' : '#733716'}" stroke-width="1" />

    <!-- Roof Right -->
    <polygon points="155,4 248,55 248,63 155,14" fill="url(#${idPrefix}_roofRightSlope)" />
    <polygon points="155,14 248,63 248,77 155,34" fill="url(#${idPrefix}_roofRightFascia)" />
    <polygon points="248,77 155,34 155,39 240,79" fill="#692806" />
    <line x1="155" y1="4" x2="248" y2="55" stroke="#FFFFF0" stroke-width="2" stroke-linecap="round" />
    <line x1="155" y1="14" x2="248" y2="63" stroke="#FFF7E0" stroke-width="1.2" />

    <!-- Left C -->
    <polygon points="149,42 149,66 103,96 76,79" fill="url(#${idPrefix}_leftCBody)" />
    <line x1="149" y1="42" x2="76" y2="79" stroke="${isDark ? '#FFFDF8' : '#85421C'}" stroke-width="1.4" />
    <polygon points="76,79 103,96 103,136 76,148" fill="url(#${idPrefix}_leftCBody)" />
    <line x1="76" y1="79" x2="76" y2="148" stroke="${isDark ? '#FFFDF8' : '#803D18'}" stroke-width="1.4" />
    <polygon points="133,76 149,66 149,166 133,148" fill="url(#${idPrefix}_leftCutout)" />

    <!-- Cutout window -->
    <polygon points="103,96 133,76 133,148 103,136" fill="${isDark ? '#26160F' : '#140400'}" />
    <line x1="103" y1="96" x2="133" y2="76" stroke="${isDark ? '#DFC7AC' : '#481F08'}" stroke-width="1.6" />
    <line x1="133" y1="76" x2="133" y2="148" stroke="${isDark ? '#B3906D' : '#301303'}" stroke-width="1.2" />
    <line x1="103" y1="136" x2="133" y2="148" stroke="${isDark ? '#D9BC9E' : '#411C06'}" stroke-width="1.2" />

    <!-- Ribbon fold -->
    <polygon points="76,148 103,136 149,166 149,188 133,188 76,148" fill="url(#${idPrefix}_leftCFold)" />
    <line x1="76" y1="148" x2="149" y2="188" stroke="${isDark ? '#FFFDF8' : '#BD5E2B'}" stroke-width="1.8" />
    <polygon points="76,148 149,188 149,190 68,154" fill="${isDark ? '#4A301E' : '#120400'}" opacity="0.7" />

    <!-- Right L -->
    <polygon points="155,40 175,50 175,166 155,188" fill="url(#${idPrefix}_colTerracotta)" />
    <line x1="155" y1="40" x2="155" y2="188" stroke="#FFC8A3" stroke-width="1.4" />
    <line x1="155" y1="188" x2="175" y2="166" stroke="#FFAF75" stroke-width="1.6" />

    <polygon points="180,61 199,71 199,166 180,166" fill="url(#${idPrefix}_colGoldMid)" />
    <polygon points="180,61 199,71 199,66 180,56" fill="#FFFBF0" />
    <line x1="180" y1="61" x2="180" y2="166" stroke="#FFFBF2" stroke-width="1.3" />

    <polygon points="204,74 219,82 219,166 204,166" fill="url(#${idPrefix}_colGoldOuter)" />
    <polygon points="204,74 219,82 219,77 204,69" fill="#FFFDF5" />
    <line x1="204" y1="74" x2="204" y2="166" stroke="#FFFFF5" stroke-width="1.3" />

    <!-- Horizontal Foot -->
    <polygon points="199,146 244,146 244,154 199,154" fill="url(#${idPrefix}_footTier1)" />
    <line x1="199" y1="146" x2="244" y2="146" stroke="#FFFFF2" stroke-width="1.3" />
    <polygon points="175,154 244,154 244,166 175,166" fill="url(#${idPrefix}_footTier2)" />
    <line x1="175" y1="154" x2="244" y2="154" stroke="#FFF7DC" stroke-width="1.3" />
    <polygon points="155,166 244,166 244,174 155,174" fill="url(#${idPrefix}_colTerracotta)" />
    <line x1="155" y1="166" x2="244" y2="166" stroke="#FFC8A3" stroke-width="1.3" />
    <line x1="175" y1="166" x2="199" y2="146" stroke="#FFE7B5" stroke-width="1.5" />

    <!-- Plinths -->
    <polygon points="52,174 149,174 149,188 34,188" fill="url(#${idPrefix}_plinthLeftUpper)" />
    <line x1="52" y1="174" x2="149" y2="174" stroke="${isDark ? '#FFFDF8' : '#85421C'}" stroke-width="1.4" />
    <polygon points="155,174 244,174 262,188 155,188" fill="url(#${idPrefix}_plinthRightUpper)" />
    <line x1="155" y1="174" x2="244" y2="174" stroke="#FFEAB8" stroke-width="1.6" />
    <polygon points="36,194 149,194 149,210 24,210" fill="url(#${idPrefix}_plinthLeftLower)" />
    <line x1="36" y1="194" x2="149" y2="194" stroke="${isDark ? '#F5E4D1' : '#642E10'}" stroke-width="1.3" />
    <polygon points="155,194 264,194 280,210 155,210" fill="url(#${idPrefix}_plinthRightLower)" />
    <line x1="155" y1="194" x2="264" y2="194" stroke="#F8C482" stroke-width="1.8" />
  </g>
  `;
};

// 1. Transparent Enlarged Footer Logo with Built-in Tagline (350x76)
const createFooterLogoTransparent = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 76" width="100%" height="100%" role="img" aria-label="Cyber Law Awareness Portal - Learn, Recognize, Stay Safe" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <g transform="translate(4, 3) scale(0.33)">
    ${getMonumentMarkup('foot_trans', 'light')}
  </g>
  <line x1="102" y1="8" x2="102" y2="68" stroke="rgba(139, 94, 60, 0.4)" stroke-width="1.5" />
  <text x="118" y="32" font-family="'Playfair Display', Georgia, serif" font-weight="700" font-size="26" letter-spacing="0.04em">
    <tspan fill="#2A1A10">CYBER </tspan><tspan fill="#7E4826">LAW</tspan>
  </text>
  <text x="120" y="49" font-family="'Montserrat', Arial, sans-serif" font-weight="700" font-size="9" fill="#2E2219" letter-spacing="0.32em">
    AWARENESS PORTAL
  </text>
  <g transform="translate(120, 64)">
    <polygon points="0,0 3,-3 6,0 3,3" fill="#7E4826" />
    <text x="14" y="2" font-family="'Montserrat', Arial, sans-serif" font-weight="600" font-size="8.5" fill="#2E2219" letter-spacing="0.22em">
      LEARN  •  RECOGNIZE  •  STAY SAFE
    </text>
  </g>
</svg>
`;

// 2. Transparent Public Navbar Logo (Light Subpages, 280x52)
const createNavbarLogoLightTransparent = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 52" width="100%" height="100%" role="img" aria-label="Cyber Law Awareness Portal" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <g transform="translate(4, 2) scale(0.23)">
    ${getMonumentMarkup('nav_light', 'light')}
  </g>
  <line x1="74" y1="8" x2="74" y2="44" stroke="rgba(139, 94, 60, 0.4)" stroke-width="1.5" />
  <text x="86" y="27" font-family="'Playfair Display', Georgia, serif" font-weight="700" font-size="20" letter-spacing="0.04em">
    <tspan fill="#2A1A10">CYBER </tspan><tspan fill="#7E4826">LAW</tspan>
  </text>
  <text x="88" y="41" font-family="'Montserrat', Arial, sans-serif" font-weight="700" font-size="7.5" fill="#2E2219" letter-spacing="0.26em">
    AWARENESS PORTAL
  </text>
</svg>
`;

// 3. Transparent Navbar & Sidebar Logo (Dark Theme / Homepage Olive, 280x52)
const createNavbarLogoDarkTransparent = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 52" width="100%" height="100%" role="img" aria-label="Cyber Law Awareness Portal" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <g transform="translate(4, 2) scale(0.23)">
    ${getMonumentMarkup('nav_dark', 'dark')}
  </g>
  <line x1="74" y1="8" x2="74" y2="44" stroke="rgba(212, 184, 149, 0.5)" stroke-width="1.5" />
  <text x="86" y="27" font-family="'Playfair Display', Georgia, serif" font-weight="700" font-size="20" letter-spacing="0.04em">
    <tspan fill="#F8F1E6">CYBER </tspan><tspan fill="#E5C088">LAW</tspan>
  </text>
  <text x="88" y="41" font-family="'Montserrat', Arial, sans-serif" font-weight="700" font-size="7.5" fill="#EBD7C1" letter-spacing="0.26em">
    AWARENESS PORTAL
  </text>
</svg>
`;

// 4. Standalone Monument (304x220)
const createStandaloneMonument = (mode = 'light') => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 304 220" width="100%" height="100%" role="img" aria-label="Cyber Law Monument Monogram" shape-rendering="geometricPrecision">
  ${getMonumentMarkup('mark_' + mode, mode)}
</svg>
`;

// 5. Stacked Logo (460x380)
const createStackedLogo = (mode = 'light') => {
  const isDark = mode === 'dark';
  const textCyber = isDark ? '#F8F1E6' : '#2A1A10';
  const textLaw = isDark ? '#E5C088' : '#7E4826';
  const textSub = isDark ? '#EBD7C1' : '#2E2219';
  const accent = isDark ? '#D4B895' : '#7E4826';
  const hairline = isDark ? 'rgba(212, 184, 149, 0.4)' : 'rgba(139, 94, 60, 0.35)';

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 380" role="img" aria-label="Cyber Law Awareness Portal" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <g transform="translate(100, 15) scale(0.855)">
    ${getMonumentMarkup('st_' + mode, mode)}
  </g>
  <text x="230" y="258" text-anchor="middle" font-family="'Playfair Display', Georgia, serif" font-weight="800" font-size="44" letter-spacing="0.05em">
    <tspan fill="${textCyber}">CYBER </tspan><tspan fill="${textLaw}">LAW</tspan>
  </text>
  <text x="230" y="292" text-anchor="middle" font-family="'Montserrat', Arial, sans-serif" font-weight="600" font-size="14" fill="${textSub}" letter-spacing="0.42em">
    AWARENESS PORTAL
  </text>
  <polygon points="230,312 235,318 230,324 225,318" fill="${accent}" />
  <line x1="50" y1="334" x2="115" y2="334" stroke="${hairline}" stroke-width="1" />
  <circle cx="115" cy="334" r="1.5" fill="${accent}" />
  <text x="230" y="338" text-anchor="middle" font-family="'Montserrat', Arial, sans-serif" font-weight="500" font-size="11" fill="${textSub}" letter-spacing="0.25em">
    LEARN  •  RECOGNIZE  •  STAY SAFE
  </text>
  <circle cx="345" cy="334" r="1.5" fill="${accent}" />
  <line x1="345" y1="334" x2="410" y2="334" stroke="${hairline}" stroke-width="1" />
</svg>
  `;
};

// 6. Squircle App Icons & Favicons (256x256)
const createAppIcon = (mode = 'dark') => {
  const isDark = mode === 'dark';
  const bg = isDark ? '#3A2E26' : '#F8F1E6';
  const border = isDark ? 'rgba(212, 184, 149, 0.2)' : 'rgba(139, 94, 60, 0.25)';

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Cyber Law App Icon" shape-rendering="geometricPrecision">
  <rect x="8" y="8" width="240" height="240" rx="54" ry="54" fill="${bg}" stroke="${border}" stroke-width="2" />
  <g transform="translate(36, 40) scale(0.605)">
    ${getMonumentMarkup('ico_' + mode, mode)}
  </g>
</svg>
  `;
};

// Write files to client/public/logo/
const logoDir = path.resolve(__dirname, '../client/public/logo');
if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });

// Footer Logo (Enlarged + Tagline + Transparent)
fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-footer.svg'), createFooterLogoTransparent().trim());

// Navbar Logos (Transparent)
fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-horizontal.svg'), createNavbarLogoLightTransparent().trim());
fs.writeFileSync(path.join(logoDir, 'logo-horizontal.svg'), createNavbarLogoLightTransparent().trim());
fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-dark.svg'), createNavbarLogoDarkTransparent().trim());
fs.writeFileSync(path.join(logoDir, 'logo-dark.svg'), createNavbarLogoDarkTransparent().trim());

// Monument Icons
fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-icon.svg'), createStandaloneMonument('light').trim());
fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-icon-dark.svg'), createStandaloneMonument('dark').trim());
fs.writeFileSync(path.join(logoDir, 'cl-mark.svg'), createStandaloneMonument('light').trim());

// Stacked
fs.writeFileSync(path.join(logoDir, 'logo-stacked.svg'), createStackedLogo('light').trim());

// App icons & Favicon
fs.writeFileSync(path.join(logoDir, 'icon-dark.svg'), createAppIcon('dark').trim());
fs.writeFileSync(path.join(logoDir, 'icon-light.svg'), createAppIcon('light').trim());
fs.writeFileSync(path.join(logoDir, 'cyber-law-favicon.svg'), createAppIcon('dark').trim());
fs.writeFileSync(path.resolve(__dirname, '../client/public/favicon.svg'), createAppIcon('dark').trim());

console.log('Successfully generated all transparent, high-contrast, integrated brand assets!');
