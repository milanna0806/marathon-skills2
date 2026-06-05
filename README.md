# 🏃 Marathon Skills 2026 — Next.js + Google Auth + Supabase

Веб-приложение для регистрации участников марафона с Google OAuth, BMI-калькулятором и базой данных Supabase.

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
│   └── globals.css                # Глобальные стили
├── supabase_migration.sql         # SQL для создания таблицы в Supabase
├── .env.example                   # Шаблон переменных окружения
├── .gitignore
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

---

### Шаг 2 — Google OAuth (Client ID и Secret)

1. Откройте https://console.cloud.google.com/
2. Создайте новый проект (или выберите существующий)
3. Перейдите в **APIs & Services → OAuth consent screen**:
   - User Type: **External**
   - Заполните название приложения и email разработчика → Сохраните
4. Перейдите в **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs — добавьте **оба** URI:
     ```
     http://localhost:3000/api/auth/callback/google
     https://ВАШ-ДОМЕН.vercel.app/api/auth/callback/google
     ```
5. Скопируйте **Client ID** и **Client Secret**

---

### Шаг 3 — Локальный запуск

```bash
# 1. Установить зависимости
npm install

# 2. Создать файл переменных окружения
cp .env.example .env.local

# 3. Заполнить .env.local реальными значениями (открыть в редакторе)
#    - GOOGLE_CLIENT_ID
#    - GOOGLE_CLIENT_SECRET
#    - NEXTAUTH_SECRET  (сгенерировать: openssl rand -base64 32)
#    - NEXTAUTH_URL=http://localhost:3000
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Запустить
npm run dev
# → http://localhost:3000
```

---

### Шаг 4 — GitHub

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ-ЛОГИН/ВАШ-РЕПОЗИТОРИЙ.git
git push -u origin main
```

> ⚠️ Файл `.env.local` добавлен в `.gitignore` — секреты **не попадут** в репозиторий.

---

### Шаг 5 — Деплой на Vercel

1. Зайдите на https://vercel.com → **New Project** → импортируйте репозиторий с GitHub
2. В разделе **Environment Variables** добавьте все переменные:

| Переменная | Значение |
|---|---|
| `GOOGLE_CLIENT_ID` | из Google Console |
| `GOOGLE_CLIENT_SECRET` | из Google Console |
| `NEXTAUTH_SECRET` | результат `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://ваш-проект.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | из Supabase Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | из Supabase Settings → API |

3. Нажмите **Deploy**
4. После деплоя — скопируйте URL и вернитесь в Google Console:
   - Добавьте Redirect URI: `https://ваш-проект.vercel.app/api/auth/callback/google`

---

## 🔐 Как работает авторизация

```
Пользователь → /login → "Войти через Google"
     ↓
Google OAuth 2.0 (redirect)
     ↓
/api/auth/callback/google  (NextAuth обрабатывает)
     ↓
JWT сессия (session.user.id = Google sub)
     ↓
Редирект на / (главная страница)
```

Все API-маршруты проверяют сессию:
```js
const session = await getServerSession(req, res, authOptions);
if (!session) return res.status(401).json({ error: "Unauthorized" });
```

---

## ✅ Функциональность

- ✅ Вход только через Google OAuth 2.0
- ✅ Фото и имя пользователя из Google в шапке
- ✅ Защищённые маршруты (без авторизации → /login)
- ✅ База данных Supabase (PostgreSQL)
- ✅ API через Serverless Functions Vercel
- ✅ Регистрация участников марафона
- ✅ BMI-калькулятор с сохранением в БД
- ✅ Таблица участников с фильтрацией и поиском
- ✅ Обратный отсчёт до старта марафона
