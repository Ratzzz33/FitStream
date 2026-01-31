# Landing SEO Migration Plan

**Цель:** Перенести лендинг на главный домен `fitstream.health` для SEO, приложение на `app.fitstream.health`

**Статус:** ✅ ЗАВЕРШЕНО
**Дата:** 2026-01-31

## Итоговая структура
- `fitstream.health` → Next.js лендинг (Hetzner VPS + Docker)
- `app.fitstream.health` → React SPA (AWS S3 + CloudFront)
- `api.fitstream.health` → Backend API (Elastic Beanstalk)

---

## Этапы

### Этап 1: Подготовка лендинга к деплою ✅
- [x] Создать worktree и план
- [x] Добавить `vercel.json` для лендинга
- [x] Добавить `Dockerfile` для Docker деплоя
- [x] Добавить `docker-compose.yml`
- [x] Обновить `next.config.ts`: export → standalone для SSR
- [x] Добавить `robots.txt` для SEO
- [x] Добавить `sitemap.ts` для автогенерации sitemap
- [x] Скопировать favicon/иконки в лендинг

### Этап 2: Подготовка приложения ✅
- [x] API URL уже на отдельном субдомене (`api.fitstream.health`)
- [x] Добавить `robots.txt` с Disallow для app subdomain
- [x] Обновить CloudFront aliases для `app.fitstream.health`
- [ ] Обновить OAuth redirect URLs (Google Sign-In) — MANUAL

### Этап 3: Обновление CI/CD ✅
- [x] Создать workflow для деплоя лендинга на Hetzner VPS
- [x] Обновить существующий deploy.yml для `app.fitstream.health`

### Этап 4: DNS и инфраструктура ✅
- [x] `app.fitstream.health` → CloudFront (alias добавлен)
- [x] `fitstream.health` → Hetzner VPS (`46.224.4.72`)
- [x] `www.fitstream.health` → Hetzner VPS (`46.224.4.72`)
- [x] SSL сертификат через Let's Encrypt
- [x] nginx reverse proxy с HTTPS

### Этап 5: Тестирование ✅
- [x] Лендинг `https://fitstream.health` — 200 OK
- [x] Приложение `https://app.fitstream.health` — 200 OK
- [x] Sitemap `https://fitstream.health/sitemap.xml` — работает
- [x] robots.txt на обоих доменах — работает
- [ ] OAuth flow — нужно обновить Google Console

---

## Инфраструктура

### Лендинг (Hetzner VPS)
- **IP:** 46.224.4.72
- **Контейнер:** fitstream-landing
- **Порт:** 3004 → nginx → 443
- **SSL:** Let's Encrypt (автообновление через certbot)
- **Путь:** /opt/fitstream-landing

### Приложение (AWS)
- **S3 Bucket:** fitstream-frontend-467968377874
- **CloudFront:** E3AIUCH1L3CNKI
- **Домены:** fitstream.health (было), app.fitstream.health (текущий)

---

## Оставшиеся задачи

1. **Google OAuth** — добавить `https://app.fitstream.health` в Authorized redirect URIs:
   - https://console.cloud.google.com/apis/credentials
   - Найти OAuth 2.0 Client ID
   - Добавить redirect URI

2. **Deep links** — проверить assetlinks.json для Android
