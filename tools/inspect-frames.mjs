/**
 * Inspect Figma frames to understand frames 10+
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = process.env.FILE_KEY;

if (!FIGMA_TOKEN) {
  console.error('Error: FIGMA_TOKEN not found in .env file');
  process.exit(1);
}

async function main() {
  console.log('Fetching Figma file structure...\n');

  const url = `https://api.figma.com/v1/files/${FILE_KEY}`;

  const response = await fetch(url, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });

  if (!response.ok) {
    console.error('API Error:', response.status);
    return;
  }

  const data = await response.json();

  console.log('File name:', data.name);
  console.log('\nPages:');

  // Find all frames
  for (const page of data.document.children) {
    console.log(`\n📄 Page: "${page.name}"`);

    if (page.children) {
      const frames = page.children.filter(n => n.type === 'FRAME');
      console.log(`   Found ${frames.length} frames`);

      frames.forEach((frame, idx) => {
        console.log(`   ${idx + 1}. "${frame.name}" (id: ${frame.id})`);

        // If it's a numbered frame >= 10, show details
        const frameNum = parseInt(frame.name);
        if (!isNaN(frameNum) && frameNum >= 10) {
          console.log(`      📍 FRAME ${frameNum} - Inspecting...`);
          if (frame.absoluteBoundingBox) {
            console.log(`      Size: ${frame.absoluteBoundingBox.width} x ${frame.absoluteBoundingBox.height}`);
          }

          // Count children
          if (frame.children) {
            const childTypes = {};
            frame.children.forEach(child => {
              childTypes[child.type] = (childTypes[child.type] || 0) + 1;
            });
            console.log(`      Children:`, childTypes);
          }
        }
      });
    }
  }

  // Now let's get details for frames 10-15 specifically
  console.log('\n\n=== DETAILED INSPECTION OF FRAMES 10-15 ===\n');

  const frameIds = [];
  for (const page of data.document.children) {
    if (page.children) {
      page.children.forEach(frame => {
        const frameNum = parseInt(frame.name);
        if (!isNaN(frameNum) && frameNum >= 10 && frameNum <= 15) {
          frameIds.push({ id: frame.id, name: frame.name });
        }
      });
    }
  }

  if (frameIds.length > 0) {
    console.log(`Found frames: ${frameIds.map(f => f.name).join(', ')}`);
    console.log(`Fetching detailed node data...\n`);

    const ids = frameIds.map(f => f.id).join(',');
    const nodeUrl = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${ids}`;

    const nodeResponse = await fetch(nodeUrl, {
      headers: { 'X-Figma-Token': FIGMA_TOKEN }
    });

    if (!nodeResponse.ok) {
      console.error('Failed to fetch nodes');
      return;
    }

    const nodeData = await nodeResponse.json();

    for (const frameInfo of frameIds) {
      const node = nodeData.nodes[frameInfo.id]?.document;
      if (!node) continue;

      console.log(`\n━━━ FRAME ${frameInfo.name} ━━━`);
      console.log(`Size: ${node.absoluteBoundingBox.width} x ${node.absoluteBoundingBox.height}`);

      // Analyze structure
      const stats = analyzeNode(node);
      console.log('Structure:');
      console.log(`  - Total children: ${stats.totalChildren}`);
      console.log(`  - Groups: ${stats.groups}`);
      console.log(`  - Ellipses: ${stats.ellipses}`);
      console.log(`  - Text: ${stats.text}`);
      console.log(`  - Other: ${stats.other}`);

      // List top-level groups
      if (node.children) {
        console.log('\nTop-level elements:');
        node.children.slice(0, 20).forEach(child => {
          let desc = `  - ${child.type}: "${child.name}"`;
          if (child.type === 'GROUP' && child.children) {
            desc += ` (${child.children.length} children)`;
          }
          console.log(desc);
        });
        if (node.children.length > 20) {
          console.log(`  ... and ${node.children.length - 20} more`);
        }
      }
    }
  }

  // Save raw data for inspection
  const fs = await import('fs');
  fs.writeFileSync('frames-10-15.json', JSON.stringify(frameIds.map(f => ({
    id: f.id,
    name: f.name
  })), null, 2));
  console.log('\n✅ Saved frame IDs to frames-10-15.json');
}

function analyzeNode(node, stats = null) {
  if (!stats) {
    stats = { totalChildren: 0, groups: 0, ellipses: 0, text: 0, other: 0 };
  }

  if (node.children) {
    stats.totalChildren += node.children.length;
    for (const child of node.children) {
      if (child.type === 'GROUP' || child.type === 'FRAME') {
        stats.groups++;
      } else if (child.type === 'ELLIPSE') {
        stats.ellipses++;
      } else if (child.type === 'TEXT') {
        stats.text++;
      } else {
        stats.other++;
      }

      // Recurse
      analyzeNode(child, stats);
    }
  }

  return stats;
}

main().catch(console.error);
