# Workflow Rules

**Наследует глобальный workflow из ~/CLAUDE.md + /strict-worktree-workflow skill.**

## Проект-специфичные настройки

| Параметр | Значение |
|----------|----------|
| Worktree директория | `../.worktrees/FitStream-<feature>` |
| Hot reload | `npm run dev` (порт 5173) |
| Main branch | main |

## Локальные проверки

```bash
npm run lint && npm run build
```

## Frontend Review

Перед PR для UI изменений:
1. `npm run dev` → проверить на http://localhost:5173
2. Пользователь одобряет визуально
3. Только после одобрения → создать PR

## Запрещено

- Прямой push в main
- `--force` push
- Merge с failed CI
