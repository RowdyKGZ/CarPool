# Деплой на Vercel — пошагово

Последовательность: прод-БД → пуш схемы → импорт в Vercel → env → деплой → пост-настройка внешних сервисов → смоук-тест.

## 0. Подготовка

- Код в GitHub-репозитории (Vercel деплоит из репо).
- Аккаунты: [Vercel](https://vercel.com), прод-Postgres ([Neon](https://neon.tech) или [Supabase](https://supabase.com)), Google Cloud (уже есть), [Resend](https://resend.com), Telegram-бот (уже есть). Опционально: [Sentry](https://sentry.io), [PostHog](https://posthog.com).
- Сгенерируй секреты заранее (каждый — своей командой):
  ```bash
  openssl rand -base64 32   # для NEXTAUTH_SECRET
  openssl rand -base64 32   # для CRON_SECRET
  openssl rand -base64 32   # для TELEGRAM_WEBHOOK_SECRET
  ```

## 1. Прод-база данных

1. Создай Postgres в Neon/Supabase → скопируй connection string (для Neon — с `?sslmode=require`).
2. Применить схему к прод-БД (миграций в проекте нет, используем push):
   ```bash
   DATABASE_URL="<prod-connection-string>" npx prisma db push
   ```
   Запускается **один раз** локально против прод-URL. Повторять после каждого изменения `schema.prisma`.

## 2. Prisma в сборке Vercel

Vercel кэширует зависимости и может не перегенерировать Prisma Client → рантайм-ошибки. Убедись, что `prisma generate` выполняется при сборке. Самый надёжный способ — `postinstall` в `package.json`:
```json
"scripts": { "postinstall": "prisma generate" }
```
(если согласишься — добавлю сам).

## 3. Импорт проекта в Vercel

1. Vercel → **Add New… → Project** → выбери GitHub-репо.
2. Framework Preset определится как **Next.js** автоматически. Build/Output не трогай.
3. **Перед первым деплоем** добавь переменные окружения (шаг 4), иначе билд/рантайм упадут.

## 4. Environment Variables (Vercel → Project → Settings → Environment Variables)

Добавь для окружения **Production** (а лучше и Preview):

| Переменная | Значение |
|---|---|
| `DATABASE_URL` | прод connection string |
| `NEXTAUTH_URL` | `https://<твой-домен>` (точный прод-URL) |
| `NEXTAUTH_SECRET` | сгенерированный секрет |
| `GOOGLE_CLIENT_ID` | из Google Cloud |
| `GOOGLE_CLIENT_SECRET` | из Google Cloud |
| `RESEND_API_KEY` | из Resend |
| `RESEND_FROM` | `CarPool <no-reply@твой-домен>` (домен должен быть верифицирован в Resend) |
| `TELEGRAM_BOT_TOKEN` | из BotFather |
| `TELEGRAM_BOT_USERNAME` | username бота без `@` |
| `TELEGRAM_WEBHOOK_SECRET` | сгенерированный секрет |
| `CRON_SECRET` | сгенерированный секрет |
| `NEXT_PUBLIC_POSTHOG_KEY` | из PostHog (опц.) |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` (опц.) |
| `SENTRY_DSN` | из Sentry (опц.) |
| `NEXT_PUBLIC_SENTRY_DSN` | из Sentry (опц.) |

> На Vercel `NODE_ENV=production` автоматически → dev-вход по email отключается, остаётся только Google. Поэтому `GOOGLE_*` обязательны.

## 5. Деплой

Нажми **Deploy**. Дождись зелёной сборки и получи домен `https://<проект>.vercel.app` (или подключи свой).

## 6. Пост-настройка внешних сервисов (после того как есть прод-домен)

### Google OAuth
В Google Cloud → твой OAuth client → добавь:
- Authorized JavaScript origin: `https://<домен>`
- Authorized redirect URI: `https://<домен>/api/auth/callback/google`

Чтобы пускать не только тест-юзеров: OAuth consent screen → **Publish app**.

### Telegram webhook
Зарегистрируй вебхук (один раз, из терминала):
```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<домен>/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```
Проверка: `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"` — должен показать твой URL без ошибок.

### Cron (напоминания)
`vercel.json` уже задаёт `0 * * * *` (ежечасно). Vercel сам шлёт `Authorization: Bearer <CRON_SECRET>`.
⚠️ **Hobby-план запускает cron максимум раз в сутки.** Для ежечасных напоминаний нужен **Vercel Pro**. На Hobby либо переведи расписание на дневное, либо считай напоминания неполными.

## 7. Смоук-тест на проде

1. Открой `https://<домен>` → редирект на вход → **Войти через Google** → онбординг профиля.
2. Создай поездку (карта грузится), забронируй вторым аккаунтом, подтверди, заверши, оставь отзыв.
3. Проверь вкладку «Уведомления» (бейдж) и письма в Resend (Logs).
4. Подключи Telegram (кнопка в кабинете) → нажми Start у бота → создай событие → проверь, что пришло в Telegram.
5. Дёрни cron руками: `curl -H "Authorization: Bearer <CRON_SECRET>" https://<домен>/api/cron/trip-reminders` → `{ ok: true, sent: N }`.
6. Сделай себя админом в прод-БД (`prisma studio` против прод-URL или SQL: `role = ADMIN`) → проверь `/admin`.

## Частые грабли

- **`redirect_uri_mismatch`** — прод redirect URI не добавлен в Google (шаг 6).
- **Prisma `Unknown field` / клиент устарел** — не выполняется `prisma generate` в сборке (шаг 2).
- **Письма не уходят** — домен в Resend не верифицирован или `RESEND_FROM` на неверифицированном домене.
- **Telegram молчит** — вебхук не зарегистрирован или `TELEGRAM_WEBHOOK_SECRET` не совпадает с тем, что в env.
- **Cron не срабатывает чаще раза в день** — Hobby-план, нужен Pro.
