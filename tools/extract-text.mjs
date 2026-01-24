/**
 * FIGMA TEXT EXTRACTOR
 * Extracts text nodes with exact positions, fonts, and styling
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = process.env.FILE_KEY || 'AKshMrSJcSCktD6O96k9Og';
const TARGET_FRAME_ID = '338:2183';  // Layer "1"

if (!FIGMA_TOKEN) {
  console.error('Error: FIGMA_TOKEN not found in .env file');
  process.exit(1);
}

const P5_SIZE = { w: 1080, h: 1350 };

async function main() {
  console.log('Fetching Figma file...\n');

  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${TARGET_FRAME_ID}`;

  const response = await fetch(url, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });

  if (!response.ok) {
    console.error('API Error:', response.status, await response.text());
    return;
  }

  const data = await response.json();
  const frameNode = data.nodes[TARGET_FRAME_ID]?.document;

  if (!frameNode) {
    console.error('Could not find frame node');
    return;
  }

  console.log(`Found frame: "${frameNode.name}"`);

  const frameOrigin = {
    x: frameNode.absoluteBoundingBox.x,
    y: frameNode.absoluteBoundingBox.y
  };
  const frameSize = {
    w: frameNode.absoluteBoundingBox.width,
    h: frameNode.absoluteBoundingBox.height
  };

  console.log(`Frame size: ${Math.round(frameSize.w)} x ${Math.round(frameSize.h)}`);

  // Extract all text nodes
  const textNodes = [];

  function extractText(node, depth = 0) {
    if (node.type === 'TEXT' && node.absoluteBoundingBox && node.characters) {
      const bbox = node.absoluteBoundingBox;

      // Get font info (Figma stores this in style)
      const fontSize = node.style?.fontSize || 12;
      const fontFamily = node.style?.fontFamily || 'Arial';
      const fontWeight = node.style?.fontWeight || 400;
      const lineHeight = node.style?.lineHeightPx || fontSize * 1.2;
      const letterSpacing = node.style?.letterSpacing || 0;
      const textAlignHorizontal = node.style?.textAlignHorizontal || 'LEFT';
      const textAlignVertical = node.style?.textAlignVertical || 'TOP';

      textNodes.push({
        id: node.id,
        name: node.name,
        text: node.characters,
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
        fontSize: fontSize,
        fontFamily: fontFamily,
        fontWeight: fontWeight,
        lineHeight: lineHeight,
        letterSpacing: letterSpacing,
        textAlignHorizontal: textAlignHorizontal,
        textAlignVertical: textAlignVertical,
        fills: node.fills,
        depth: depth
      });

      console.log(`  ${'  '.repeat(depth)}TEXT: "${node.characters.substring(0, 30)}${node.characters.length > 30 ? '...' : ''}" (${fontSize}px ${fontFamily})`);
    }

    if (node.children) {
      for (const child of node.children) {
        extractText(child, depth + 1);
      }
    }
  }

  console.log('\nExtracting text nodes:\n');
  extractText(frameNode);
  console.log(`\nExtracted ${textNodes.length} text nodes total`);

  // Transform to p5 coordinates
  const scaleX = P5_SIZE.w / frameSize.w;
  const scaleY = P5_SIZE.h / frameSize.h;

  const transformedTexts = textNodes.map(node => {
    const x = (node.x - frameOrigin.x) * scaleX;
    const y = (node.y - frameOrigin.y) * scaleY;
    const width = node.width * scaleX;
    const height = node.height * scaleY;
    const fontSize = node.fontSize * scaleX;
    const lineHeight = node.lineHeight * scaleY;

    return {
      name: node.name,
      text: node.text,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      width: Math.round(width * 100) / 100,
      height: Math.round(height * 100) / 100,
      fontSize: Math.round(fontSize * 100) / 100,
      fontFamily: node.fontFamily,
      fontWeight: node.fontWeight,
      lineHeight: Math.round(lineHeight * 100) / 100,
      letterSpacing: node.letterSpacing,
      textAlignHorizontal: node.textAlignHorizontal,
      textAlignVertical: node.textAlignVertical,
      fills: node.fills
    };
  });

  // Create output
  const output = {
    meta: {
      sourceFrame: frameNode.name,
      figmaSize: { w: Math.round(frameSize.w), h: Math.round(frameSize.h) },
      p5Size: P5_SIZE,
      totalTexts: textNodes.length,
      extractedAt: new Date().toISOString()
    },
    texts: transformedTexts
  };

  const fs = await import('fs');
  fs.writeFileSync('text-data.json', JSON.stringify(output, null, 2));

  console.log('\n✅ Saved to text-data.json');

  // Preview
  console.log('\nPreview (first text node):');
  if (transformedTexts.length > 0) {
    console.log(JSON.stringify(transformedTexts[0], null, 2));
  }
}

main().catch(console.error);
