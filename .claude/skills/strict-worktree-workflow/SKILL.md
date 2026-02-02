---
name: strict-worktree-workflow
description: MANDATORY workflow - ALL tasks MUST start in git worktree. Auto-detects YOUR worktrees by git author. No direct commits to main/master. Complete via PR with passing tests/CI. Delete worktree after merge.
---

# Strict Worktree Workflow

## CORE CONCEPT: Worktree = Task

**Every worktree is linked to a persistent Task with git author.**
- Worktree created → Task created with author email
- Session restart → Check worktrees → Resume only YOUR Tasks
- PR merged + worktree deleted → Task completed

**CRITICAL: Only manage YOUR OWN worktrees!**
- Task metadata stores `git_author` (from `git config user.email`)
- Only resume Tasks where `git_author` matches current user
- IGNORE worktrees belonging to other team members

---

## SESSION START PROTOCOL (MANDATORY)

**On EVERY session start in a git repository, IMMEDIATELY run this check:**

### Step 0: Get Current Git Author

```bash
# Get current user's git email
MY_EMAIL=$(git config user.email)
echo "Current git author: $MY_EMAIL"
```

### Step 1: List All Worktrees

```bash
git worktree list
```

### Step 2: Check TaskList for YOUR Tasks Only

```
TaskList
```

**For each Task with worktree metadata:**
1. Check if `metadata.git_author` matches `$MY_EMAIL`
2. If YES and not completed → This is YOUR Task, resume it
3. If NO → IGNORE (belongs to another team member)

### Step 3: Handle Orphaned Worktrees

For worktrees that exist but have no linked Task:
```bash
# Check last commit author in worktree
cd <worktree_path>
AUTHOR=$(git log -1 --format="%ae" 2>/dev/null)
```

- If `$AUTHOR` matches `$MY_EMAIL` → Create Task for it
- If `$AUTHOR` doesn't match → IGNORE (not yours)
- If no commits yet → Ask user if this is their worktree

### Resume Protocol

```
Current git author: developer@company.com

Checking Tasks...

Task #1: "Implement auth"
  → git_author: colleague@company.com
  → IGNORING (not your Task)

Task #2: "Add login form"
  → git_author: developer@company.com
  → This is YOUR Task, resuming...

Checking worktrees without Tasks...

Found: .worktrees/feature-api [no Task]
  → Last commit author: colleague@company.com
  → IGNORING (not your worktree)

Found: .worktrees/feature-ui [no Task]
  → Last commit author: developer@company.com
  → Creating Task for YOUR orphaned worktree
```

**NEVER touch worktrees/Tasks belonging to other git authors.**

---

## MANDATORY RULES

### Rule 1: NEVER Commit to Main Branch
- **NEVER** make direct commits to `main` or `master`
- If on main/master → STOP → Create worktree first

### Rule 2: Plan + Improvements BEFORE Work
- **ALWAYS create a plan** before starting any work
- **ALWAYS suggest improvements** — think how to make it BETTER than asked
- Plan stored in Task description
- Plan includes: goal, steps, acceptance criteria, **improvements**
- **Wait for user confirmation** before implementing

### Rule 3: Worktree = Task (Always Linked)
- Create worktree → Create Task with plan
- Task stores: worktree path, branch, plan, progress
- Task persists across sessions

### Rule 4: Resume Before New Work
- Session start → Check worktrees → Resume incomplete Tasks
- Only start new work when all worktree Tasks are completed

### Rule 5: Completion = PR Merged + Worktree Deleted
- PR created → Task status: "PR created, waiting for CI"
- CI passes → Task status: "CI passed, ready to merge"
- PR merged → Delete worktree → Task status: "completed"

---

## CREATING NEW WORKTREE + TASK

### Step 0: Create Plan + Suggest Improvements (MANDATORY)

**Before creating worktree, ALWAYS create a plan AND suggest improvements:**

```
## План
1. [Шаг 1] — что делаем
2. [Шаг 2] — что делаем
3. ...

## Критерии приёмки
- [ ] Критерий 1
- [ ] Критерий 2

## Предлагаю улучшить (ОБЯЗАТЕЛЬНО)
- [Улучшение 1]: почему это лучше
- [Улучшение 2]: почему это лучше

Подтверди план или скажи что изменить.
```

**Types of improvements to suggest:**

| Category | Examples |
|----------|----------|
| **UX/UI** | Better user flow, accessibility, responsive design |
| **Performance** | Caching, lazy loading, batch operations, indexes |
| **Security** | Input validation, rate limiting, auth checks |
| **Reliability** | Error handling, retries, logging, edge cases |
| **API Design** | Better response format, pagination, filtering |
| **Code Quality** | Reusable components, type safety, tests |

**Think:** "Как сделать ЛУЧШЕ чем просят?" — not just "как сделать что просят".

**WAIT for user confirmation before proceeding!**

### Step 1: Verify No Incomplete Worktrees

```bash
# Check for existing worktrees
git worktree list | grep -v "$(git rev-parse --show-toplevel)$"
```

If found → Check their Tasks first → Resume or complete them.

### Step 2: Create Worktree

```bash
branch_name="feature/<descriptive-name>"
worktree_dir=".worktrees"

# Ensure .worktrees exists and is ignored
mkdir -p "$worktree_dir"
git check-ignore -q "$worktree_dir" || echo "$worktree_dir/" >> .gitignore

# Create worktree
git fetch origin
git worktree add "$worktree_dir/$branch_name" -b "$branch_name" origin/main
cd "$worktree_dir/$branch_name"
```

### Step 3: Create Linked Task (with git author)

**IMPORTANT: Always include git_author in metadata!**

```bash
# Get current git author
MY_EMAIL=$(git config user.email)
```

Use TaskCreate with worktree metadata:

```
TaskCreate:
  subject: "<Goal of the work>"
  description: |
    Worktree: .worktrees/<branch_name>
    Branch: <branch_name>
    Author: <git_author_email>

    ## План (утверждён пользователем)
    1. <Шаг 1>
    2. <Шаг 2>
    3. ...

    ## Критерии приёмки
    - [ ] <Criterion 1>
    - [ ] <Criterion 2>

    ## Прогресс
    - [x] План утверждён
    - [x] Worktree создан
    - [ ] <Следующий шаг>

    ## Status
    - Created worktree
    - Dependencies installed
    - Baseline tests: <passing/failing>
  activeForm: "Working on <short-description>"
  metadata: {
    "worktree_path": ".worktrees/<branch_name>",
    "branch": "<branch_name>",
    "git_author": "<git_config_user_email>",
    "category": "<backend|frontend|bot|docs>",
    "skill": "<skill-name-if-specific>",
    "plan_approved": true,
    "pr_url": null,
    "ci_status": null
  }
```

**CRITICAL fields:**
- `git_author` — identifies task ownership
- `plan_approved: true` — confirms plan was approved before work

**Optional fields (for multi-agent coordination):**
- `category` — filter tasks: backend, frontend, bot, docs
- `skill` — specific skill to use (e.g., `api-endpoint-generator`)

### Step 4: Setup & Baseline

```bash
# Install dependencies
[ -f package.json ] && npm install
[ -f Cargo.toml ] && cargo build
[ -f requirements.txt ] && pip install -r requirements.txt

# Verify baseline
npm test  # or equivalent
```

Update Task description with baseline status.

---

## WORKING IN WORKTREE

### During Work

- Commit frequently with conventional format
- Run tests after significant changes
- **Update Task description** with progress notes
- Sync with main periodically to avoid large conflicts

### Commit Format

```
<type>(<scope>): <description>
```

**Types:**
| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring |
| `docs` | Documentation |
| `test` | Adding/updating tests |
| `chore` | Maintenance, deps |

**Examples:**
```bash
git commit -m "feat(auth): add login form validation"
git commit -m "fix(api): handle null response from server"
git commit -m "refactor(utils): extract date formatting helpers"
```

### Syncing with Main (Conflict Prevention)

**Do this regularly** (at least daily on active branches):

```bash
git fetch origin
git rebase origin/main
```

**If conflicts occur:**
1. Resolve conflicts in each file
2. `git add <resolved-files>`
3. `git rebase --continue`
4. Update Task: "Resolved conflicts with main"

**If rebase gets messy:**
```bash
git rebase --abort  # Start over
# Then try again or ask for help
```

### Progress Updates

```
TaskUpdate:
  taskId: "<id>"
  description: |
    ... (existing content)

    ## Progress
    - [x] Created login form component
    - [x] Added form validation
    - [ ] Connect to auth API
    - [ ] Add error handling
```

---

## COMPLETING WORKTREE TASK

### Step 1: Pre-Completion Verification

```bash
# All tests must pass
npm test

# Lint/format check
npm run lint
```

### Step 2: Create PR

```bash
git push -u origin "$branch_name"
gh pr create --title "<title>" --body "<body>"
```

Update Task:
```
TaskUpdate:
  taskId: "<id>"
  description: |
    ...

    ## Status
    PR created: <url>
    Waiting for CI...
  metadata: {
    "pr_url": "<url>",
    "ci_status": "pending"
  }
```

### Step 3: Wait for CI

```bash
gh pr checks --watch
```

Update Task when CI completes:
```
TaskUpdate:
  metadata: { "ci_status": "passed" }  # or "failed"
```

### Step 4: Merge (Only After CI Passes)

```bash
gh pr merge --squash --delete-branch
```

### Step 5: Cleanup & Complete Task

```bash
# Return to main repo
cd "$(git worktree list | head -1 | awk '{print $1}')"
git checkout main
git pull

# Remove worktree
git worktree remove ".worktrees/$branch_name"
git worktree prune
```

Complete Task:
```
TaskUpdate:
  taskId: "<id>"
  status: "completed"
```

---

## SESSION START CHECKLIST

```
□ Run: git worktree list
□ For each non-main worktree:
  □ Run: TaskList - find linked Task
  □ If Task incomplete → Resume it
  □ If no Task → Create one, ask user for goal
□ Only after all worktree Tasks handled:
  □ Ask user for new work
```

---

## QUICK REFERENCE

| Event | Action |
|-------|--------|
| Session start | Check worktrees → Resume Tasks |
| New task request | Verify no incomplete worktrees → Create worktree + Task |
| During work | Update Task progress, sync with main |
| Commit | Use conventional format: `type(scope): desc` |
| Conflicts | `git rebase origin/main` → resolve → continue |
| PR created | Update Task with PR URL |
| CI passes | Update Task CI status |
| PR merged | Delete worktree → Complete Task |
| Session end | Task persists for next session |

## Task Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Worktree created, work not started |
| `in_progress` | Actively working |
| `in_progress` + PR URL | Waiting for CI/review |
| `completed` | PR merged, worktree deleted |

## Branch Naming

- `feature/<name>` - New features
- `fix/<name>` - Bug fixes
- `refactor/<name>` - Refactoring
- `docs/<name>` - Documentation
- `chore/<name>` - Maintenance

**Ownership is determined by `git_author` in Task metadata, not branch name.**

---

## ERROR RECOVERY

### Orphaned Worktree (No Task)

```
Found worktree without Task: .worktrees/feature/old-work
Options:
1. Create Task and continue work
2. Delete worktree (abandon work)

Which option?
```

### Task Without Worktree

```
Found Task referencing missing worktree: .worktrees/feature/deleted
The worktree was deleted but Task not completed.

Options:
1. Mark Task as completed (work was merged elsewhere)
2. Recreate worktree and continue
3. Delete Task (work abandoned)

Which option?
```

### CI Failed

1. Fix issues in worktree
2. Push fixes
3. Update Task: "CI failed, fixing..."
4. Wait for CI re-run
5. **NEVER** force merge

---

## RED FLAGS

**NEVER:**
- Start work without approved plan
- Just do what asked without suggesting improvements
- Touch worktrees/Tasks belonging to other git authors
- Start new work with YOUR incomplete worktree Tasks
- Commit directly to main/master
- Merge with failing CI
- Delete worktree without completing Task
- Complete Task without merging PR
- Create Task without `git_author` in metadata
- Create Task without plan in description
- Use `git push --force` (destroys history)
- Let branch drift too far from main (sync daily)

**ALWAYS:**
- Create plan and wait for user approval BEFORE worktree
- **Suggest improvements** — think how to make it BETTER than asked
- Check `git config user.email` on session start
- Only resume Tasks where `metadata.git_author` matches YOUR email
- Include plan AND improvements in Task description
- Include `git_author` in Task metadata when creating
- Update Task progress as work proceeds
- Complete Task only after PR merged + worktree deleted
- Use conventional commit format (`type(scope): description`)
- Rebase on main regularly to prevent conflicts

---

## MULTI-AGENT COORDINATION

### Task Categories

Use `metadata.category` to filter tasks for parallel work:

| Category | Agent Focus |
|----------|-------------|
| `backend` | API, DB, services |
| `frontend` | UI, components |
| `bot` | Telegram, handlers |
| `docs` | Documentation |

### Parallel Agents Example

```
# Agent 1 (Terminal 1)
> TaskList → filter by category: backend
> Take Task with YOUR git_author

# Agent 2 (Terminal 2)
> TaskList → filter by category: frontend
> Take Task with YOUR git_author
```

### Task → Skill Binding

If task has `metadata.skill`, use that skill:
```
Task #4: "Create API endpoint"
  metadata.skill: "api-endpoint-generator"

→ Agent loads skill → follows its protocol
→ Consistent results across team
```

### When to Create Skills

**Create skill when:**
- Same pattern repeats 3+ times
- Multiple agents need same approach
- Need guaranteed consistency

**Don't pre-create** — create when actually needed.
