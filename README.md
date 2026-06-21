# CarPool

CarPool - mobile-first MVP сервиса совместных поездок для повторяющихся маршрутов по Бишкеку.

Текущее продуктовое описание зафиксировано в [docs/mvp.md](docs/mvp.md).

## Что входит в MVP

- водитель создает запланированную поездку
- пассажир находит поездку и бронирует место
- водитель подтверждает или отклоняет бронь
- обе стороны получают уведомления по email и в Telegram
- после завершения поездки обе стороны могут оставить отзыв

Маршрут в MVP задается водителем как точка A и точка B на карте. Интерфейс показывает между ними простую линию, без live tracking и без сложного matching по геометрии дороги.

Первая версия не включает онлайн-оплату, live tracking, нативные мобильные приложения и сложный matching по геометрии маршрута.

## Язык продукта

- весь пользовательский интерфейс должен быть на русском языке
- статусы, ошибки, email и Telegram-уведомления тоже должны быть на русском
- код, Prisma-модели, названия сущностей и технические идентификаторы остаются на английском
- базовый словарь пользовательских текстов лежит в `src/lib/content/ru.ts`

## Текущий auth-срез

- сейчас подключен базовый auth через `next-auth` с JWT-сессией
- вход для текущего этапа упрощен: пользователь входит по email и при желании сразу указывает имя
- после первого входа пользователь попадает в onboarding профиля
- production-цель для MVP все еще остается прежней: email magic link или другой верифицируемый вход

## Стек

- Next.js 16 с App Router и TypeScript
- Prisma ORM
- PostgreSQL
- Tailwind CSS
- Mapbox для точки A, точки B и базовой линии маршрута
- Telegram Bot API и email для уведомлений
- Vercel и managed Postgres для деплоя

## Локальный запуск

1. Скопируй `.env.example` в `.env`.
2. Укажи корректный `DATABASE_URL`.
3. Добавь `NEXTAUTH_URL` и `NEXTAUTH_SECRET`.
4. Установи зависимости через `npm install`.
5. Сгенерируй Prisma client командой `npm run prisma:generate`.
6. Запусти приложение через `npm run dev`.

## Docker

Поднять весь локальный стек:

```bash
npm run docker:up
```

Если нужна только PostgreSQL для Prisma или DBeaver:

```bash
npm run docker:db
```

После запуска доступны:

- приложение Next.js на `http://localhost:3000`
- PostgreSQL на `localhost:5432`

Полезные команды:

- `npm run docker:logs` для просмотра логов контейнеров
- `npm run docker:down` для остановки стека

При первом `npm run docker:up` контейнер `app` установит npm-зависимости внутри Docker volume, поэтому первый старт может занять больше времени.

Если `package-lock.json` изменился или внутри volume не хватает пакета вроде `next-auth`, dev-контейнер автоматически выполнит `npm ci` повторно и обновит зависимости.

Параметры PostgreSQL для DBeaver:

- host: `localhost`
- port: `5432`
- database: `carpool`
- user: `postgres`
- password: `postgres`

## Скрипты

- `npm run dev` запускает development server
- `npm run lint` запускает ESLint
- `npm run prisma:generate` пересобирает Prisma client
- `npm run db:push` применяет текущую Prisma schema к базе
- `npm run db:studio` открывает Prisma Studio

## Telegram-уведомления

Уведомления пишутся в БД всегда и видны во вкладке «Уведомления». Внешняя доставка
включается, когда заданы переменные окружения; без них всё работает как in-app лента.

Доставка выбирается на пользователя: если он привязал Telegram — шлём в Telegram,
иначе fallback на email (Resend). Бот может писать только тем, кто сам нажал Start,
поэтому привязка идёт через одноразовый токен.

Настройка бота:

1. Создай бота у [@BotFather](https://t.me/BotFather), получи token и username.
2. Заполни `.env`: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`.
3. Подними публичный URL (прод-домен или `ngrok http 3000` локально).
4. Зарегистрируй вебхук (одноразово):

   ```bash
   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -d "url=https://<твой-домен>/api/telegram/webhook" \
     -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
   ```

5. В приложении: «Кабинет» → «Подключить Telegram» → откроется бот → Start. После
   этого `chat_id` сохранится и уведомления пойдут в Telegram.

## Ближайший порядок разработки

1. Профиль водителя и машина
2. Создание поездки, список поездок и бронирование
3. Уведомления, отзывы и инструменты админа
