# Landing SEO Migration Plan

**Цель:** Перенести лендинг на главный домен `fitstream.health` для SEO, приложение на `app.fitstream.health`

**Ветка:** `feat/landing-seo`
**Дата:** 2026-01-31

## Текущая структура
- `fitstream.health` → React SPA (приложение)
- `app.fitstream.health` → ссылается на приложение (в коде)
- Лендинг → не задеплоен

## Целевая структура
- `fitstream.health` → Next.js лендинг (SSR/SSG для SEO)
- `app.fitstream.health` → React SPA (приложение)

---

## Этапы

### Этап 1: Подготовка лендинга к деплою
- [x] Создать worktree и план
- [x] Добавить `vercel.json` для лендинга
- [x] Проверить все внутренние ссылки в лендинге (уже корректные)
- [x] Добавить `robots.txt` для SEO
- [x] Добавить `sitemap.ts` для автогенерации sitemap
- [x] Скопировать favicon/иконки в лендинг

### Этап 2: Подготовка приложения
- [x] API URL уже на отдельном субдомене (`api.fitstream.health`) — не трогаем
- [x] Добавить `robots.txt` с Disallow для app subdomain
- [ ] Добавить редирект с `app.fitstream.health` в CloudFront/DNS (MANUAL)
- [ ] Обновить OAuth redirect URLs (Google Sign-In) (MANUAL)
- [ ] Обновить capacitor.config.ts если нужно

### Этап 3: Обновление CI/CD
- [x] Создать workflow для деплоя лендинга на Vercel
- [x] Обновить существующий deploy.yml для `app.fitstream.health`

### Этап 4: DNS и домены
- [ ] Настроить `app.fitstream.health` → CloudFront (приложение)
- [ ] Настроить `fitstream.health` → Vercel (лендинг)
- [ ] Проверить SSL сертификаты

### Этап 5: Тестирование
- [ ] Проверить лендинг на `fitstream.health`
- [ ] Проверить приложение на `app.fitstream.health`
- [ ] Проверить OAuth flow
- [ ] Проверить deep links в мобильном приложении

---

## Файлы для изменения

### Лендинг (`landing-next/`)
- `vercel.json` — создать
- `components/home/Hero.tsx` — проверить ссылки
- `components/home/DownloadCTA.tsx` — проверить ссылки
- `components/shared/Header.tsx` — проверить ссылки
- `components/shared/Footer.tsx` — проверить ссылки

### Приложение (корень)
- `.github/workflows/deploy.yml` — обновить на `app.fitstream.health`
- `services/api.ts` — проверить API URL
- `capacitor.config.ts` — проверить настройки
- `App.tsx` — проверить OAuth client ID redirect

### Инфраструктура
- DNS записи для `app.fitstream.health`
- Vercel project linking

---

## Риски
1. **OAuth redirect mismatch** — нужно добавить `app.fitstream.health` в Google Console
2. **Кэш CloudFront** — инвалидировать после изменений
3. **Deep links в мобильном** — проверить assetlinks.json / apple-app-site-association
