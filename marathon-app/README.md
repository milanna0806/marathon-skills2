# 🏃 Marathon Skills 2026 — Next.js + Google Auth + Supabase

## Структура проекта

```
marathon-app/
├── pages/
│   ├── _app.js                    # SessionProvider для NextAuth
│   ├── index.js                   # Главная страница (защищённая)
│   ├── login.js                   # Страница входа через Google
│   └── api/
│       ├── auth/
│       │   └── [...nextauth].js   # Google OAuth 2.0
│       └── participants/
│           ├── index.js           # GET (список) / POST (создать)
│           └── [id].js            # PATCH (обновить BMI)
├── lib/
│   └── supabase.js                # Клиент Supabase
├── styles/
│   └── globals.css                # Стили
├── supabase_migration.sql         # SQL для создания таблицы
├── .env.example                   # Шаблон переменных окружения
└── package.json
```

---

## 📋 Пошаговое развёртывание

### Шаг 1 — Supabase (база данных)

1. Зайдите на https://app.supabase.com → создайте новый проект
2. Перейдите в **SQL Editor** → вставьте содержимое файла `supabase_migration.sql` → нажмите **Run**
3. Перейдите в **Settings → API** → скопируйте:
   - `Project URL` → это `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` ключ → это `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Шаг 2 — Google OAuth (Client ID и Secret)

1. Откройте https://console.cloud.google.com/
2. Создайте новый проект (или выберите существующий)
3. Перейдите в **APIs & Services → OAuth consent screen**:
   - User Type: External
   - Заполните название приложения
   - Добавьте email разработчика
   - Сохраните
4. Перейдите в **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs — добавьте ОБА:
     ```
     http://localhost:3000/api/auth/callback/google
     https://ВАШ-ДОМЕН.vercel.app/api/auth/callback/google
     ```
5. Скопируйте **Client ID** и **Client Secret**

### Шаг 3 — Локальный запуск

```bash
# Установить зависимости
npm install

# Создать файл переменных окружения
cp .env.example .env.local
# Заполнить .env.local реальными значениями

# Запустить разработку
npm run dev
# → http://localhost:3000
```

### Шаг 4 — Деплой на Vercel

1. Загрузите проект на GitHub
2. Зайдите на https://vercel.com → **New Project** → импортируйте репозиторий
3. В разделе **Environment Variables** добавьте все переменные:

| Переменная | Значение |
|---|---|
| `GOOGLE_CLIENT_ID` | из Google Console |
| `GOOGLE_CLIENT_SECRET` | из Google Console |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://ваш-проект.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | из Supabase Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | из Supabase Settings |

4. Нажмите **Deploy**
5. После деплоя — скопируйте URL и вернитесь в Google Console, добавьте Redirect URI с реальным доменом

---

## 🔐 Как работает авторизация

```
Пользователь → /login → Кнопка "Войти через Google"
     ↓
Google OAuth 2.0 (redirect)
     ↓
/api/auth/callback/google (NextAuth обрабатывает)
     ↓
JWT сессия создаётся (session.user.id = Google sub)
     ↓
Редирект на / (главная страница)
```

Все API-запросы проверяют сессию:
```js
const session = await getServerSession(req, res, authOptions);
if (!session) return res.status(401).json({ error: "Unauthorized" });
```

---

## ✅ Результат

- ✅ Вход только через Google OAuth 2.0
- ✅ В шапке — фото и имя пользователя из Google
- ✅ Защищённые маршруты (без авторизации → /login)
- ✅ База данных Supabase (PostgreSQL)
- ✅ API через Serverless Functions Vercel (/api/participants)
- ✅ Все запросы к БД через API с проверкой user_id из сессии
- ✅ Регистрация участников марафона
- ✅ BMI-калькулятор с сохранением в БД
- ✅ Таблица участников с фильтрацией и поиском
