#!/usr/bin/env node
/**
 * Hook: Block file edits if not in a linked git worktree
 * Enforces: All changes must be made in worktrees, not in the main repo
 *
 * Main repo: .git is a DIRECTORY
 * Linked worktree: .git is a FILE containing "gitdir: /path/to/main/.git/worktrees/name"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read JSON input from stdin
let input = '';
process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
    let chunk;
    while ((chunk = process.stdin.read()) !== null) {
        input += chunk;
    }
});

process.stdin.on('end', () => {
    try {
        const data = JSON.parse(input);
        const toolName = data.tool_name || '';
        const filePath = data.tool_input?.file_path || '';

        // Only check Edit and Write tools
        if (!['Edit', 'Write'].includes(toolName)) {
            process.exit(0);
        }

        // Skip config files (allow editing hooks, configs in main repo)
        const ext = path.extname(filePath).toLowerCase();
        const skipExts = ['.md', '.json', '.yaml', '.yml', '.txt', '.env', '.gitignore', '.sh', '.cjs'];
        if (skipExts.includes(ext)) {
            process.exit(0);
        }

        // Skip .claude directory (allow setting up hooks)
        if (filePath.includes('.claude')) {
            process.exit(0);
        }

        // Check if we're in the main repo or a linked worktree
        const gitPath = path.join(process.cwd(), '.git');

        try {
            const stat = fs.statSync(gitPath);

            if (stat.isDirectory()) {
                // .git is a directory = MAIN REPO = BLOCK source file edits
                const currentBranch = execSync('git branch --show-current', {
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'pipe']
                }).trim();

                console.error('');
                console.error('═══════════════════════════════════════════════════════════');
                console.error('  BLOCKED: Editing source files in main repo is not allowed');
                console.error('═══════════════════════════════════════════════════════════');
                console.error('');
                console.error(`  Current: Main repo on branch "${currentBranch}"`);
                console.error('  Required: Linked git worktree');
                console.error('');
                console.error('Create a worktree and work there:');
                console.error('');
                console.error('  git worktree add ../FitStream-<feature> -b feature/<feature>');
                console.error('  cd ../FitStream-<feature>');
                console.error('  claude  # restart Claude Code in the worktree');
                console.error('');
                console.error('After completing work:');
                console.error('  1. Commit, push, create PR');
                console.error('  2. WAIT for CI to pass');
                console.error('  3. Merge to main');
                console.error('  4. git worktree remove ../FitStream-<feature>');
                console.error('');
                process.exit(2); // Exit code 2 = block the action
            }

            // .git is a file = linked worktree = ALLOW
            process.exit(0);

        } catch (e) {
            // .git doesn't exist, not a git repo - allow
            process.exit(0);
        }

    } catch (e) {
        // JSON parse error or other issue - allow (fail open)
        process.exit(0);
    }
});
