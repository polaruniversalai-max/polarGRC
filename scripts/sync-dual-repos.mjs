import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

const OWNER = 'polaruniversalai-max';
const PRIVATE_REPO = 'sentinel-core-private';
const PUBLIC_REPO = 'polarGRC';
const BRANCH = 'main';

const IP_EXCLUSIONS = new Set([
  'sentinel-vault',
  'contracts/solidity',
  'contracts/move',
  'contracts/core',
  'contracts/adapters',
  'server/services/owasp-sc-hardening.ts',
  'server/services/movement_service.ts',
  'server/services/route-orchestrator-service.ts',
  'shared/logic/routeController.ts',
  'shared/logic/complianceAgent.ts',
  'server/middleware/security.ts',
]);

const ALWAYS_EXCLUDE = new Set([
  '.git', 'node_modules', '.cache', '.config', '.local', '.upm',
  'dist', 'secrets', '__pycache__', '.temp-entry.ts', '.temp-bundle.js',
  '.pythonlibs', '.npm', '.nix-defexpr', '.nix-profile', 'coverage',
  '.nyc_output', 'logs', 'internal-docs', 'private-keys', '.secrets',
  'artifacts', 'cache', 'build', 'archive', 'attached_assets',
]);

const ALWAYS_EXCLUDE_FILES = new Set([
  '.env', '.env.local', '.env.development', '.env.production', '.env.test',
  '.replit', 'replit.nix', 'replit.md', 'package-lock.json',
  '.sanitization-report.json',
]);

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;
  if (!xReplitToken) throw new Error('X_REPLIT_TOKEN not found');

  const data = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
  ).then(res => res.json());

  const conn = data.items?.[0];
  const accessToken = conn?.settings?.access_token || conn?.settings?.oauth?.credentials?.access_token;
  if (!accessToken) throw new Error('GitHub not connected');
  return accessToken;
}

function shouldExcludeAlways(relativePath) {
  const parts = relativePath.split('/');
  if (ALWAYS_EXCLUDE.has(parts[0])) return true;
  if (ALWAYS_EXCLUDE_FILES.has(parts[0])) return true;
  if (relativePath.endsWith('.log')) return true;
  if (relativePath.endsWith('.pyc')) return true;
  if (relativePath.endsWith('.pem') || relativePath.endsWith('.key')) return true;
  if (parts.includes('__pycache__')) return true;
  if (relativePath.startsWith('.temp')) return true;
  return false;
}

function shouldExcludeFromPublic(relativePath) {
  for (const exclusion of IP_EXCLUSIONS) {
    if (relativePath === exclusion || relativePath.startsWith(exclusion + '/')) {
      return true;
    }
  }
  return false;
}

function getAllFiles(dir, baseDir = dir) {
  const files = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return files; }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (shouldExcludeAlways(relativePath)) continue;

    if (entry.isDirectory()) {
      if (ALWAYS_EXCLUDE.has(entry.name)) continue;
      if (entry.name === 'build' || entry.name === 'dependencies') continue;
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      const stat = fs.statSync(fullPath);
      if (stat.size > 5 * 1024 * 1024) continue;
      if (entry.name.endsWith('.apk') || entry.name.endsWith('.tar.gz') || entry.name.endsWith('.whl')) continue;
      if (entry.name.endsWith('.so') || entry.name.endsWith('.dylib')) continue;
      files.push(relativePath);
    }
  }
  return files;
}

async function syncToRepo(octokit, repoName, files, commitMessage) {
  console.log(`\n--- Syncing to ${OWNER}/${repoName} (${files.length} files) ---`);

  let latestCommitSha;
  try {
    const { data: ref } = await octokit.rest.git.getRef({
      owner: OWNER, repo: repoName, ref: `heads/${BRANCH}`
    });
    latestCommitSha = ref.object.sha;
    console.log(`  Current HEAD: ${latestCommitSha.slice(0, 7)}`);
  } catch (e) {
    console.log(`  Branch not found, creating initial commit...`);
    latestCommitSha = null;
  }

  const BATCH_SIZE = 3;
  const tree = [];
  let blobCount = 0;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(async (filePath) => {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        const content = fs.readFileSync(fullPath).toString('base64');
        const { data: blob } = await octokit.rest.git.createBlob({
          owner: OWNER, repo: repoName, content, encoding: 'base64'
        });
        return { path: filePath, mode: '100644', type: 'blob', sha: blob.sha };
      } catch (err) {
        if (err.status === 403 || err.message?.includes('rate limit')) {
          console.log(`  Rate limited, waiting 30s...`);
          await sleep(30000);
          try {
            const fullPath2 = path.join(process.cwd(), filePath);
            const content2 = fs.readFileSync(fullPath2).toString('base64');
            const { data: blob2 } = await octokit.rest.git.createBlob({
              owner: OWNER, repo: repoName, content: content2, encoding: 'base64'
            });
            return { path: filePath, mode: '100644', type: 'blob', sha: blob2.sha };
          } catch (retryErr) {
            console.log(`  Skip after retry: ${filePath}`);
            return null;
          }
        }
        console.log(`  Skip: ${filePath} (${err.message?.slice(0, 60)})`);
        return null;
      }
    }));
    for (const r of results) {
      if (r) { tree.push(r); blobCount++; }
    }
    if ((i / BATCH_SIZE) % 15 === 0 && i > 0) {
      console.log(`  Progress: ${blobCount}/${files.length} blobs created`);
    }
    await sleep(200);
  }

  console.log(`  Created ${blobCount} blobs total`);

  const treeParams = { owner: OWNER, repo: repoName, tree };
  if (latestCommitSha) {
    const { data: commitData } = await octokit.rest.git.getCommit({
      owner: OWNER, repo: repoName, commit_sha: latestCommitSha
    });
    treeParams.base_tree = commitData.tree.sha;
  }

  const { data: newTree } = await octokit.rest.git.createTree(treeParams);

  const commitParams = {
    owner: OWNER, repo: repoName,
    message: commitMessage,
    tree: newTree.sha,
    parents: latestCommitSha ? [latestCommitSha] : []
  };
  const { data: newCommit } = await octokit.rest.git.createCommit(commitParams);
  console.log(`  New commit: ${newCommit.sha.slice(0, 7)}`);

  try {
    await octokit.rest.git.updateRef({
      owner: OWNER, repo: repoName,
      ref: `heads/${BRANCH}`, sha: newCommit.sha, force: true
    });
  } catch {
    await octokit.rest.git.createRef({
      owner: OWNER, repo: repoName,
      ref: `refs/heads/${BRANCH}`, sha: newCommit.sha
    });
  }

  console.log(`  Pushed to https://github.com/${OWNER}/${repoName}`);
  return newCommit.sha;
}

async function main() {
  console.log('=============================================');
  console.log('  Sentinel OS v1.2 - Dual Repo Sync');
  console.log('  Private (full) + Public (wrapper only)');
  console.log('=============================================\n');

  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });

  const { data: user } = await octokit.rest.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}\n`);

  const allFiles = getAllFiles(process.cwd());
  console.log(`Total workspace files: ${allFiles.length}`);

  const privateFiles = allFiles;
  const publicFiles = allFiles.filter(f => !shouldExcludeFromPublic(f));

  const ipExcludedCount = privateFiles.length - publicFiles.length;
  console.log(`Private repo files: ${privateFiles.length} (full codebase)`);
  console.log(`Public repo files:  ${publicFiles.length} (${ipExcludedCount} IP files excluded)`);

  console.log('\nIP-protected files excluded from public:');
  for (const f of privateFiles) {
    if (shouldExcludeFromPublic(f)) {
      console.log(`  - ${f}`);
    }
  }

  const timestamp = new Date().toISOString().split('T')[0];

  const privateCommitMsg = `Sentinel OS v1.2 - Full Codebase Sync (${timestamp})

OWASP Smart Contract Top 10 (2026) Hardened: 10 active security guards
Route Orchestrator: 3 strategies across 14 network nodes
Industry Chains: Pharma (Akiri/DokChain), Banking (QNT/Ondo/Ripple), Research
Multi-chain settlement: Movement M1 + Celestia + Stacks + ICP
5-Sector Compliance Engine + PII Vault + NDCT 2026 Amendment`;

  const publicCommitMsg = `Sentinel OS v1.2 - Public Release (${timestamp})

Global Compliance Operating System - The Regulatory Swiss Army Knife
- OWASP SC Top 10 (2026) Hardened (10 active guards)
- Route Orchestrator: INSTITUTIONAL / PRO_AUDIT / ECONOMY
- Industry Chains: Pharma, Banking, Research
- Multi-chain: Movement M1, Celestia, Stacks, ICP, QNT, Ondo, Ripple
- PII Vault: 15+ masking patterns (HIPAA/DPDP/GDPR)

Note: Core IP (smart contracts, security layer, route controller) is in the private repo.`;

  const privateSha = await syncToRepo(octokit, PRIVATE_REPO, privateFiles, privateCommitMsg);

  const publicSha = await syncToRepo(octokit, PUBLIC_REPO, publicFiles, publicCommitMsg);

  console.log('\n=============================================');
  console.log('  DUAL SYNC COMPLETE');
  console.log('=============================================');
  console.log(`  Private: ${privateSha.slice(0, 7)} (${privateFiles.length} files)`);
  console.log(`  Public:  ${publicSha.slice(0, 7)} (${publicFiles.length} files)`);
  console.log(`  IP files excluded from public: ${ipExcludedCount}`);
  console.log(`\n  Private: https://github.com/${OWNER}/${PRIVATE_REPO}`);
  console.log(`  Public:  https://github.com/${OWNER}/${PUBLIC_REPO}`);
}

main().catch(err => {
  console.error('\nSync failed:', err.message);
  if (err.response) console.error('API response:', err.response.data?.message);
  process.exit(1);
});
