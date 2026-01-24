/**
 * Analyze frames 10-13 in detail to understand the animation progression
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = process.env.FILE_KEY;

// From previous inspection
const FRAME_IDS = {
  '10': '338:21116',
  '11': '338:23051',
  '12': '338:87',
  '13': '338:1080'
};

async function main() {
  const frameNames = ['10', '11', '12', '13'];
  const ids = frameNames.map(n => FRAME_IDS[n]).join(',');

  console.log('Fetching frames 10-13 in detail...\n');

  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${ids}`;
  const response = await fetch(url, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });

  if (!response.ok) {
    console.error('API Error:', response.status);
    return;
  }

  const data = await response.json();

  for (const frameName of frameNames) {
    const frameId = FRAME_IDS[frameName];
    const node = data.nodes[frameId]?.document;

    if (!node) {
      console.log(`Could not find frame ${frameName}`);
      continue;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`FRAME ${frameName} - Visual Analysis`);
    console.log('='.repeat(60));

    const analysis = analyzeFrame(node);

    console.log('\n📊 OVERVIEW:');
    console.log(`  Total ellipses (dots): ${analysis.totalEllipses}`);
    console.log(`  Total text elements: ${analysis.totalText}`);
    console.log(`  Visible text words: ${analysis.textContent.length}`);

    console.log('\n🔵 DOT SIZES:');
    const sizeGroups = groupBySizes(analysis.ellipses);
    for (const [size, count] of Object.entries(sizeGroups).sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))) {
      console.log(`  ${size}px: ${count} dots`);
    }

    console.log('\n🔤 TEXT ELEMENTS:');
    if (analysis.textContent.length > 0) {
      console.log('  Sample text:', analysis.textContent.slice(0, 20).join(', '));
      if (analysis.textContent.length > 20) {
        console.log(`  ... and ${analysis.textContent.length - 20} more words`);
      }
    } else {
      console.log('  (No text visible)');
    }

    console.log('\n📍 DOT DISTRIBUTION:');
    console.log(`  From 2026 number: ${analysis.from2026 || '?'}`);
    console.log(`  From small text: ${analysis.fromSmallText || '?'}`);
    console.log(`  From other: ${analysis.fromOther || '?'}`);

    // Analyze dot fills/strokes
    console.log('\n🎨 DOT APPEARANCE:');
    const colorAnalysis = analyzeDotColors(analysis.ellipses);
    console.log(`  White filled: ${colorAnalysis.whiteFilled}`);
    console.log(`  Blue filled: ${colorAnalysis.blueFilled}`);
    console.log(`  With stroke: ${colorAnalysis.withStroke}`);
    console.log(`  No stroke: ${colorAnalysis.noStroke}`);
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('KEY INSIGHTS:');
  console.log('='.repeat(60));
  console.log('Comparing the frames:');
  console.log('- Frame 10 should have the most dots (peak saturation)');
  console.log('- Frame 11 should have fewer dots as foam begins separating');
  console.log('- Frames 12-13 should show text emerging with moderate dots');
  console.log('- Blue vs white dots should shift between frames');
}

function analyzeFrame(node) {
  const ellipses = [];
  const textContent = [];
  let totalText = 0;

  function traverse(n) {
    if (n.type === 'ELLIPSE' && n.absoluteBoundingBox) {
      const bbox = n.absoluteBoundingBox;
      const isCircle = Math.abs(bbox.width - bbox.height) < 2;

      if (isCircle) {
        ellipses.push({
          r: bbox.width / 2,
          fill: n.fills?.[0],
          stroke: n.strokes?.[0],
          strokeWeight: n.strokeWeight || 0,
          name: n.name,
          opacity: n.opacity !== undefined ? n.opacity : 1
        });
      }
    }

    if (n.type === 'TEXT') {
      totalText++;
      if (n.characters && n.characters.trim()) {
        textContent.push(n.characters.trim());
      }
    }

    if (n.children) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }

  traverse(node);

  return {
    totalEllipses: ellipses.length,
    totalText,
    ellipses,
    textContent
  };
}

function groupBySizes(ellipses) {
  const groups = {};

  for (const e of ellipses) {
    const size = Math.round(e.r * 2);  // diameter
    const key = size < 10 ? '< 10' :
               size < 20 ? '10-20' :
               size < 40 ? '20-40' :
               size < 80 ? '40-80' :
               size < 150 ? '80-150' : '> 150';

    groups[key] = (groups[key] || 0) + 1;
  }

  return groups;
}

function analyzeDotColors(ellipses) {
  let whiteFilled = 0;
  let blueFilled = 0;
  let withStroke = 0;
  let noStroke = 0;

  for (const e of ellipses) {
    // Check fill
    if (e.fill && e.fill.color) {
      const { r, g, b } = e.fill.color;
      if (r > 0.9 && g > 0.9 && b > 0.9) {
        whiteFilled++;
      } else if (b > 0.8 && r < 0.3) {
        blueFilled++;
      }
    }

    // Check stroke
    if (e.strokeWeight > 0 && e.stroke) {
      withStroke++;
    } else {
      noStroke++;
    }
  }

  return { whiteFilled, blueFilled, withStroke, noStroke };
}

main().catch(console.error);
