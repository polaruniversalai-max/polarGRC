#!/usr/bin/env node
/**
 * Sentinel Vault Bundle Builder
 * ==============================
 * Compiles and obfuscates all sentinel-vault TypeScript files
 * into a single, unreadable bundle using javascript-obfuscator.
 * 
 * Features:
 * - Control Flow Flattening (makes logic flow unreadable)
 * - String Array Encoding (encodes all strings)
 * - Dead Code Injection (adds fake code paths)
 * - Self-Defending (crashes if formatted/modified)
 */

const esbuild = require('esbuild');
const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const VAULT_DIR = path.join(__dirname, '..', 'sentinel-vault');
const OUTPUT_FILE = path.join(__dirname, '..', 'sentinel-core.bundle.js');
const TEMP_BUNDLE = path.join(__dirname, '..', '.temp-bundle.js');

async function buildBundle() {
  console.log('🔒 Sentinel Vault Bundle Builder');
  console.log('================================\n');

  // Step 1: Find all TypeScript files in sentinel-vault
  console.log('📁 Scanning sentinel-vault directory...');
  const tsFiles = findTypeScriptFiles(VAULT_DIR);
  console.log(`   Found ${tsFiles.length} TypeScript files\n`);

  if (tsFiles.length === 0) {
    console.error('❌ No TypeScript files found in sentinel-vault');
    process.exit(1);
  }

  // Step 2: Create entry point that exports everything
  console.log('📝 Creating temporary entry point...');
  const entryContent = generateEntryPoint(tsFiles);
  const tempEntry = path.join(__dirname, '.temp-entry.ts');
  fs.writeFileSync(tempEntry, entryContent);

  // Step 3: Bundle with esbuild
  console.log('📦 Bundling with esbuild...');
  try {
    await esbuild.build({
      entryPoints: [tempEntry],
      bundle: true,
      outfile: TEMP_BUNDLE,
      format: 'iife',
      globalName: 'SentinelCore',
      target: 'es2020',
      minify: false, // We'll obfuscate instead
      platform: 'browser',
    });
    console.log('   Bundle created successfully\n');
  } catch (error) {
    console.error('❌ esbuild failed:', error);
    cleanup(tempEntry);
    process.exit(1);
  }

  // Step 4: Read the bundled code
  const bundledCode = fs.readFileSync(TEMP_BUNDLE, 'utf8');
  console.log(`   Bundle size: ${(bundledCode.length / 1024).toFixed(2)} KB\n`);

  // Step 5: Apply heavy obfuscation
  console.log('🔐 Applying javascript-obfuscator...');
  console.log('   - Control Flow Flattening: ENABLED');
  console.log('   - String Array Encoding: base64 + rc4');
  console.log('   - Dead Code Injection: ENABLED');
  console.log('   - Self-Defending: ENABLED\n');

  const obfuscationResult = JavaScriptObfuscator.obfuscate(bundledCode, {
    // Control Flow Flattening - Makes logic flow unreadable
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    
    // String Array - Encodes all strings
    stringArray: true,
    stringArrayThreshold: 0.75,
    stringArrayEncoding: ['base64', 'rc4'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    
    // Dead Code Injection - Adds fake code paths
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    
    // Self-Defending - Crashes if code is formatted/modified
    selfDefending: true,
    
    // Additional obfuscation
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: true,
    renameProperties: false, // Keep exports readable
    transformObjectKeys: true,
    unicodeEscapeSequence: true,
    
    // Compact output
    compact: true,
    simplify: true,
    
    // Split strings into chunks
    splitStrings: true,
    splitStringsChunkLength: 5,
    
    // Disable console (optional, for extra protection)
    disableConsoleOutput: false,
    
    // Source map (disabled for security)
    sourceMap: false,
  });

  const obfuscatedCode = obfuscationResult.getObfuscatedCode();
  console.log(`   Obfuscated size: ${(obfuscatedCode.length / 1024).toFixed(2)} KB\n`);

  // Step 6: Add header and save
  const finalCode = `/**
 * SENTINEL CORE ENGINE - OBFUSCATED BUNDLE
 * =========================================
 * Version: 1.2.0
 * Build Date: ${new Date().toISOString()}
 * 
 * COPYRIGHT (C) 2026 PolarUniversal Inc.
 * All Rights Reserved.
 * 
 * This code is protected by:
 * - Control Flow Flattening
 * - String Array Encoding (Base64 + RC4)
 * - Dead Code Injection
 * - Self-Defending Mechanisms
 * 
 * NOTICE: Unauthorized reverse engineering, decompilation,
 * or disassembly is strictly prohibited and may result
 * in civil and criminal penalties.
 * 
 * For licensing: legal@polaruniversal.io
 */

${obfuscatedCode}
`;

  fs.writeFileSync(OUTPUT_FILE, finalCode);
  console.log(`✅ Bundle saved to: sentinel-core.bundle.js`);
  console.log(`   Final size: ${(finalCode.length / 1024).toFixed(2)} KB\n`);

  // Step 7: Cleanup temp files
  cleanup(tempEntry);
  console.log('🧹 Cleaned up temporary files');
  console.log('\n🔒 Sentinel Vault successfully bundled and obfuscated!');
}

function findTypeScriptFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findTypeScriptFiles(fullPath, files);
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function generateEntryPoint(files) {
  const imports = [];
  const exports = [];
  
  for (let i = 0; i < files.length; i++) {
    const relativePath = path.relative(path.dirname(path.join(__dirname, '.temp-entry.ts')), files[i])
      .replace(/\\/g, '/')
      .replace(/\.ts$/, '');
    
    const moduleName = `mod${i}`;
    imports.push(`import * as ${moduleName} from '${relativePath}';`);
    exports.push(`  ...${moduleName},`);
  }
  
  return `${imports.join('\n')}

const SentinelCore = {
${exports.join('\n')}
};

export default SentinelCore;

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).SentinelCore = SentinelCore;
}
`;
}

function cleanup(tempEntry) {
  try {
    if (fs.existsSync(tempEntry)) fs.unlinkSync(tempEntry);
    if (fs.existsSync(TEMP_BUNDLE)) fs.unlinkSync(TEMP_BUNDLE);
  } catch (e) {
    // Ignore cleanup errors
  }
}

// Run the build
buildBundle().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
