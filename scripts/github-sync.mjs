import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

let connectionSettings;

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
  if (!accessToken) throw new Error('GitHub not connected');
  return accessToken;
}

async function main() {
  console.log('Authenticating with GitHub...');
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  const user = await octokit.rest.users.getAuthenticated();
  console.log(`Authenticated as: ${user.data.login}`);
  
  // List repos
  const repos = await octokit.rest.repos.listForAuthenticatedUser({ per_page: 30 });
  console.log('\n=== Your GitHub Repositories ===');
  repos.data.forEach((r, i) => console.log(`${i+1}. ${r.full_name} (${r.html_url})`));
  
  // Look for PolarUniversal repo
  const polarRepo = repos.data.find(r => r.name.toLowerCase().includes('polar'));
  if (polarRepo) {
    console.log(`\nPolarUniversal repo found: ${polarRepo.html_url}`);
    console.log('To sync, push manually or configure git remote');
  }
}

main().catch(console.error);
