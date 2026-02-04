import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const REPO_OWNER = 'polaruniversalai-max';
const REPO_NAME = 'polarGRC';
const BRANCH = 'main';

let connectionSettings;

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) throw new Error('X_REPLIT_TOKEN not found');

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
  if (!accessToken) throw new Error('GitHub not connected');
  return accessToken;
}

async function getFileContent(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) return null;
  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) return null;
  return fs.readFileSync(fullPath).toString('base64');
}

async function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    // Skip node_modules, .git, cache, artifacts
    if (['.git', 'node_modules', 'cache', 'artifacts', '.replit', '.upm'].includes(entry.name)) continue;
    
    if (entry.isDirectory()) {
      files.push(...await getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

async function main() {
  console.log('🔄 Starting GitHub Sync...\n');
  
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  // Get current commit SHA
  const { data: ref } = await octokit.rest.git.getRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: `heads/${BRANCH}`
  });
  const latestCommitSha = ref.object.sha;
  console.log(`📍 Current commit: ${latestCommitSha.slice(0, 7)}`);
  
  // Get the tree
  const { data: commit } = await octokit.rest.git.getCommit({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    commit_sha: latestCommitSha
  });
  
  // Get all files to sync
  const files = await getAllFiles(process.cwd());
  console.log(`📁 Found ${files.length} files to sync`);
  
  // Create blobs for each file
  const tree = [];
  for (const file of files) {
    const content = await getFileContent(file);
    if (!content) continue;
    
    const { data: blob } = await octokit.rest.git.createBlob({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      content: content,
      encoding: 'base64'
    });
    
    tree.push({
      path: file,
      mode: '100644',
      type: 'blob',
      sha: blob.sha
    });
  }
  
  console.log(`✅ Created ${tree.length} blobs`);
  
  // Create new tree
  const { data: newTree } = await octokit.rest.git.createTree({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    tree: tree,
    base_tree: commit.tree.sha
  });
  
  // Create commit
  const commitMessage = `v3.1.0-WHALE: Multi-chain deployment sync - ${new Date().toISOString()}`;
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    message: commitMessage,
    tree: newTree.sha,
    parents: [latestCommitSha]
  });
  
  console.log(`📝 Created commit: ${newCommit.sha.slice(0, 7)}`);
  
  // Update branch reference
  await octokit.rest.git.updateRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: `heads/${BRANCH}`,
    sha: newCommit.sha
  });
  
  console.log(`\n✅ GitHub sync complete!`);
  console.log(`🔗 https://github.com/${REPO_OWNER}/${REPO_NAME}`);
}

main().catch(err => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});
