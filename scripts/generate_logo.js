import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateSignetLogo() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080c16" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#04060c" />
    </linearGradient>

    <!-- Inner Rim Gradient -->
    <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9" />
      <stop offset="25%" stop-color="#00f5ff" stop-opacity="0.5" />
      <stop offset="65%" stop-color="#1e293b" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.75" />
    </linearGradient>

    <!-- Ambient Core Glow -->
    <radialGradient id="coreGlow" cx="50%" cy="58%" r="48%">
      <stop offset="0%" stop-color="#00f5ff" stop-opacity="0.28" />
      <stop offset="35%" stop-color="#0284c7" stop-opacity="0.10" />
      <stop offset="70%" stop-color="#0f172a" stop-opacity="0.02" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Seal Radial Glow -->
    <radialGradient id="sealGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00f5ff" stop-opacity="1" />
      <stop offset="40%" stop-color="#0284c7" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#0369a1" stop-opacity="0" />
    </radialGradient>

    <!-- Cyan Ingot Gradient -->
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe" />
      <stop offset="30%" stop-color="#38bdf8" />
      <stop offset="70%" stop-color="#00f5ff" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <!-- Drop Shadow Filter -->
    <filter id="shadowDepth" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.8" />
    </filter>

    <!-- Neon Glow Filter -->
    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- 1. SQUIRCLE CANONICAL CONTAINER (1024x1024, rx=220) -->
  <rect width="1024" height="1024" rx="220" ry="220" fill="url(#bgGrad)" />

  <!-- 2. HIGH-TECH DUAL INNER RIM -->
  <rect x="16" y="16" width="992" height="992" rx="208" ry="208" fill="none" stroke="url(#rimGrad)" stroke-width="3" />
  <rect x="28" y="28" width="968" height="968" rx="196" ry="196" fill="none" stroke="#00f5ff" stroke-width="1.2" opacity="0.15" />

  <!-- Ambient Backdrop Glow -->
  <rect width="1024" height="1024" rx="220" ry="220" fill="url(#coreGlow)" />

  <!-- Geometric Blueprint Hexagon Grid Background -->
  <g opacity="0.12" stroke="#00f5ff" stroke-width="1.8" fill="none">
    <polygon points="512,90 850,285 850,675 512,870 174,675 174,285" />
    <polygon points="512,145 800,310 800,645 512,810 224,645 224,310" stroke-dasharray="14 10" />
    <line x1="512" y1="90" x2="512" y2="145" />
    <line x1="850" y1="285" x2="800" y2="310" />
    <line x1="850" y1="675" x2="800" y2="645" />
    <line x1="512" y1="870" x2="512" y2="810" />
    <line x1="174" y1="675" x2="224" y2="645" />
    <line x1="174" y1="285" x2="224" y2="310" />
  </g>

  <!-- ==================== SIGNET MASCOT: THE ORIGAMI FALCON ==================== -->
  <g filter="url(#shadowDepth)">

    <!-- A. SOLID BASE SILHOUETTE (Watertight foundation preventing light leaks) -->
    <polygon points="
      512,140
      560,180 625,230 730,290 840,380 865,510 815,645 745,745 640,820 512,855
      384,820 279,745 209,645 159,510 184,380 294,290 399,230 464,180
    " fill="#050811" />

    <!-- B. DYNAMIC ORIGAMI WINGS -->
    <!-- LEFT WING (ILLUMINATED FACETS) -->
    <!-- Top Wing Blade -->
    <polygon points="512,230 440,210 330,260 210,360 290,380 390,330 465,285" fill="#475569" stroke="#1e293b" stroke-width="1.5" />
    <!-- Outer Wing Primary Feather 1 (Top Sharp Tip) -->
    <polygon points="330,260 184,380 290,380" fill="#64748b" stroke="#334155" stroke-width="1.5" />
    <!-- Outer Wing Primary Feather 2 (Mid Swept Blade) -->
    <polygon points="184,380 159,510 245,490 320,440 290,380" fill="#334155" stroke="#1e293b" stroke-width="1.5" />
    <!-- Outer Wing Primary Feather 3 (Lower Sweep Blade) -->
    <polygon points="159,510 209,645 285,585 325,510 245,490" fill="#475569" stroke="#1e293b" stroke-width="1.5" />
    <!-- Outer Wing Terminal Quill Tip -->
    <polygon points="209,645 279,745 335,675 345,585 285,585" fill="#1e293b" stroke="#00f5ff" stroke-width="1.5" stroke-opacity="0.6" />
    <!-- Mid Wing Coverts (Bracing Chest) -->
    <polygon points="390,330 290,380 320,440 410,400" fill="#64748b" stroke="#334155" stroke-width="1.5" />
    <polygon points="410,400 320,440 325,510 420,470" fill="#475569" stroke="#1e293b" stroke-width="1.5" />
    <polygon points="420,470 325,510 345,585 435,550" fill="#334155" stroke="#1e293b" stroke-width="1.5" />

    <!-- RIGHT WING (SHADOW FACETS) -->
    <!-- Top Wing Blade -->
    <polygon points="512,230 584,210 694,260 814,360 734,380 634,330 559,285" fill="#1e293b" stroke="#0f172a" stroke-width="1.5" />
    <!-- Outer Wing Primary Feather 1 -->
    <polygon points="694,260 840,380 734,380" fill="#111827" stroke="#090d16" stroke-width="1.5" />
    <!-- Outer Wing Primary Feather 2 -->
    <polygon points="840,380 865,510 779,490 704,440 734,380" fill="#0f172a" stroke="#090d16" stroke-width="1.5" />
    <!-- Outer Wing Primary Feather 3 -->
    <polygon points="865,510 815,645 739,585 699,510 779,490" fill="#111827" stroke="#090d16" stroke-width="1.5" />
    <!-- Outer Wing Terminal Quill Tip -->
    <polygon points="815,645 745,745 689,675 679,585 739,585" fill="#0a0f1d" stroke="#0284c7" stroke-width="1.5" stroke-opacity="0.4" />
    <!-- Mid Wing Coverts -->
    <polygon points="634,330 734,380 704,440 614,400" fill="#1e293b" stroke="#0f172a" stroke-width="1.5" />
    <polygon points="614,400 704,440 699,510 604,470" fill="#0f172a" stroke="#090d16" stroke-width="1.5" />
    <polygon points="604,470 699,510 679,585 589,550" fill="#111827" stroke="#090d16" stroke-width="1.5" />

    <!-- Electric Cyan Flight Pinstripes along Wing Edges -->
    <line x1="330" y1="260" x2="184" y2="380" stroke="#00f5ff" stroke-width="3" stroke-linecap="round" filter="url(#neonGlow)" />
    <line x1="184" y1="380" x2="159" y2="510" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
    <line x1="159" y1="510" x2="209" y2="645" stroke="#00f5ff" stroke-width="2" stroke-linecap="round" />

    <line x1="694" y1="260" x2="840" y2="380" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" />
    <line x1="840" y1="380" x2="865" y2="510" stroke="#0369a1" stroke-width="2" stroke-linecap="round" />

    <!-- C. CHEST BREASTPLATE (Framing Central Seal) -->
    <polygon points="512,470 455,485 435,550 460,635 512,625" fill="#334155" stroke="#475569" stroke-width="1.5" />
    <polygon points="512,470 569,485 589,550 564,635 512,625" fill="#1e293b" stroke="#334155" stroke-width="1.5" />

    <polygon points="512,625 460,635 440,715 512,735" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
    <polygon points="512,625 564,635 584,715 512,735" fill="#0f172a" stroke="#1e293b" stroke-width="1.5" />

    <!-- D. CENTRAL ILLUMINATED SIGNET SEAL / WAX NOTARY MEDALLION -->
    <g transform="translate(512, 620)">
      <!-- Ambient Radiant Halo -->
      <circle cx="0" cy="0" r="118" fill="url(#sealGlow)" opacity="0.4" />

      <!-- Hexagonal Wax Stamp Outer Ingot -->
      <polygon points="0,-98 85,-49 85,49 0,98 -85,49 -85,-49" fill="#070b14" stroke="url(#cyanGrad)" stroke-width="5" filter="url(#neonGlow)" />

      <!-- Concentric Step 1 -->
      <polygon points="0,-82 71,-41 71,41 0,82 -71,41 -71,-41" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5" opacity="0.9" />

      <!-- Concentric Step 2 (Dashed Verification Track) -->
      <polygon points="0,-68 59,-34 59,34 0,68 -59,34 -59,-34" fill="#091122" stroke="#00f5ff" stroke-width="1.8" stroke-dasharray="6 4" opacity="0.85" />

      <!-- Notary Monogram: Cryptographic 'S' & Quill Nib -->
      <path d="M 28,-36 L -16,-36 C -34,-36 -44,-24 -44,-10 C -44,8 -26,16 0,22 C 28,28 44,36 44,52 C 44,68 28,76 -6,76 L -34,76" 
            fill="none" stroke="url(#cyanGrad)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" filter="url(#neonGlow)" />

      <!-- Diagonal Quill Stylus Blade -->
      <polygon points="-22,-52 -14,-56 46,38 38,42" fill="#ffffff" opacity="0.95" />
      <circle cx="44" cy="40" r="5" fill="#00f5ff" />
      <circle cx="-18" cy="-54" r="4" fill="#38bdf8" />

      <!-- 4 Cryptographic Seal Hashes -->
      <circle cx="0" cy="-50" r="3" fill="#00f5ff" />
      <circle cx="50" cy="0" r="3" fill="#00f5ff" />
      <circle cx="0" cy="50" r="3" fill="#00f5ff" />
      <circle cx="-50" cy="0" r="3" fill="#00f5ff" />
    </g>

    <!-- E. TAIL & PEDESTAL PERCH (Solid Architectural Grounding) -->
    <!-- Diamond Tail Feathers -->
    <polygon points="512,735 440,715 470,815 512,855" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
    <polygon points="512,735 584,715 554,815 512,855" fill="#0f172a" stroke="#1e293b" stroke-width="1.5" />
    <polygon points="512,855 490,820 512,800 534,820" fill="#00f5ff" opacity="0.9" filter="url(#neonGlow)" />

    <!-- Architectural Pedestal Perch Beam -->
    <polygon points="290,775 385,820 512,850 639,820 734,775 694,830 512,885 330,830" fill="#090d16" stroke="#1e293b" stroke-width="2" />
    <polygon points="330,830 512,885 694,830 674,845 512,900 350,845" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
    <line x1="340" y1="835" x2="512" y2="890" stroke="#00f5ff" stroke-width="2.5" stroke-linecap="round" opacity="0.8" />
    <line x1="512" y1="890" x2="684" y2="835" stroke="#0284c7" stroke-width="2" stroke-linecap="round" opacity="0.6" />

    <!-- Talons Gripping Beam -->
    <polygon points="405,808 425,792 435,828 415,838" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" />
    <polygon points="425,792 445,782 455,822 435,828" fill="#94a3b8" stroke="#64748b" stroke-width="1" />
    <polygon points="445,782 465,777 470,817 455,822" fill="#64748b" stroke="#334155" stroke-width="1" />

    <polygon points="619,808 599,792 589,828 609,838" fill="#475569" stroke="#1e293b" stroke-width="1" />
    <polygon points="599,792 579,782 569,822 589,838" fill="#334155" stroke="#1e293b" stroke-width="1" />
    <polygon points="579,782 559,777 554,817 569,822" fill="#1e293b" stroke="#0f172a" stroke-width="1" />

    <!-- ==================== F. FALCON HEAD & SHARP FEATURES (TOP LAYER) ==================== -->
    <!-- 1. Central Crown Crest (Swept Origami Feather Spikes) -->
    <polygon points="512,140 480,185 512,215" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5" />
    <polygon points="512,140 544,185 512,215" fill="#334155" stroke="#1e293b" stroke-width="1.5" />

    <!-- Crown Lateral Cuts -->
    <polygon points="512,140 464,180 420,225 480,235 512,215" fill="#94a3b8" stroke="#475569" stroke-width="1.5" />
    <polygon points="512,140 560,180 604,225 544,235 512,215" fill="#1e293b" stroke="#0f172a" stroke-width="1.5" />

    <!-- Upper Forehead Plane -->
    <polygon points="512,215 480,235 450,280 512,295" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5" />
    <polygon points="512,215 544,235 574,280 512,295" fill="#475569" stroke="#1e293b" stroke-width="1.5" />

    <!-- Cheeks & Malar Base (Drawn UNDER eyes and beak) -->
    <polygon points="480,235 420,225 385,295 440,310" fill="#64748b" stroke="#334155" stroke-width="1.5" />
    <polygon points="544,235 604,225 639,295 584,310" fill="#1e293b" stroke="#0f172a" stroke-width="1.5" />

    <polygon points="440,310 385,295 405,370 445,355" fill="#334155" stroke="#1e293b" stroke-width="1.5" />
    <polygon points="584,310 639,295 619,370 579,355" fill="#0f172a" stroke="#0b0f19" stroke-width="1.5" />

    <!-- Throat Lateral Planes -->
    <polygon points="445,355 405,370 430,430 465,420" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
    <polygon points="579,355 619,370 594,430 559,420" fill="#0a0f1d" stroke="#1e293b" stroke-width="1.5" />

    <!-- 2. SHARP SUPRAORBITAL BROW RIDGES -->
    <polygon points="512,295 450,280 415,315 470,325" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
    <polygon points="512,295 574,280 609,315 554,325" fill="#64748b" stroke="#334155" stroke-width="1.5" />

    <!-- 3. GLOWING PREDATOR EYES (PROMINENT, UNMISTAKABLE ELECTRIC CYAN) -->
    <!-- Left Eye -->
    <polygon points="430,318 472,326 450,348 420,336" fill="#030712" stroke="#00f5ff" stroke-width="1.5" />
    <polygon points="432,322 468,328 450,344 424,334" fill="#00f5ff" filter="url(#neonGlow)" />
    <circle cx="448" cy="333" r="3.5" fill="#ffffff" />

    <!-- Right Eye -->
    <polygon points="594,318 552,326 574,348 604,336" fill="#030712" stroke="#00f5ff" stroke-width="1.5" />
    <polygon points="592,322 556,328 574,344 598,334" fill="#00f5ff" filter="url(#neonGlow)" />
    <circle cx="576" cy="333" r="3.5" fill="#ffffff" />

    <!-- 4. PREDATORY HOOKED BEAK (ARCHITECTURAL SCULPTURE) -->
    <!-- Upper Beak Culmen Bridge -->
    <polygon points="512,295 470,325 478,380 512,395" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" />
    <polygon points="512,295 554,325 546,380 512,395" fill="#0284c7" stroke="#0369a1" stroke-width="1.5" />

    <!-- Down-Curving Beak Hook (Fierce Raptor Hook) -->
    <polygon points="512,395 478,380 492,450 512,475" fill="url(#cyanGrad)" stroke="#00f5ff" stroke-width="1.5" filter="url(#neonGlow)" />
    <polygon points="512,395 546,380 532,450 512,475" fill="#0369a1" stroke="#0284c7" stroke-width="1.5" />

    <!-- Undercut Beak Tomium -->
    <polygon points="512,475 492,450 512,435" fill="#00f5ff" />
    <polygon points="512,475 532,450 512,435" fill="#0284c7" />

    <!-- Throat / Chin Keel connecting Beak to Chest -->
    <polygon points="512,475 465,465 512,470" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
    <polygon points="512,475 559,465 512,470" fill="#0f172a" stroke="#1e293b" stroke-width="1.5" />

  </g>
</svg>`;
}

async function run() {
  const svg = generateSignetLogo();
  const svgPath = path.resolve(__dirname, '../docs/images/logo.svg');
  const pngPath = path.resolve(__dirname, '../docs/images/logo.png');

  fs.writeFileSync(svgPath, svg, 'utf-8');
  console.log(`Saved SVG to ${svgPath}`);

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1024,
    },
    font: {
      loadSystemFonts: true,
    },
    shapeRendering: 2,
    textRendering: 1,
    imageRendering: 0,
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  fs.writeFileSync(pngPath, pngBuffer);
  console.log(`Rendered 1024x1024 PNG to ${pngPath} (${pngBuffer.length} bytes)`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
