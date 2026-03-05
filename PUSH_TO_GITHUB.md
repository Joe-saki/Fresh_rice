# 🚀 Push CampusBite to GitHub

## Step 1 — Make sure your repo exists
Go to https://github.com/new and create a repo called `Fresh_rice` (it may already exist).

## Step 2 — Initialize Git and push

Open a terminal in the `Fresh_rice` folder and run:

```bash
git init
git add .
git commit -m "🍚 Initial CampusBite full-stack app"
git branch -M main
git remote add origin https://github.com/Joe-saki/Fresh_rice.git
git push -u origin main
```

## Step 3 — Deploy Backend to Railway.app

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# From the backend/ folder:
cd backend
railway init
railway add --database postgresql
railway up
```

Railway will give you a URL like `https://campusbite-api.up.railway.app`.
Update your `EXPO_PUBLIC_API_URL` in the student app and rider app with this URL.

## Step 4 — Deploy Vendor Dashboard to Vercel

```bash
npm install -g vercel
cd vendor-dashboard
vercel --prod
```

## Step 5 — Build Student App for Android

```bash
cd student-app
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

## Environment Variables to Set in Railway

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Auto-set by Railway PostgreSQL |
| `JWT_SECRET` | Any long random string |
| `HUBTEL_CLIENT_ID` | From hubtel.com/developers |
| `HUBTEL_CLIENT_SECRET` | From hubtel.com/developers |
| `HUBTEL_MERCHANT_ID` | From hubtel.com/developers |
| `ARKESEL_API_KEY` | From arkesel.com |
| `GOOGLE_MAPS_API_KEY` | From console.cloud.google.com |

## Test Accounts (after seeding)
- 📱 Admin: +233200000000
- 🏪 Vendor: +233201111111
- 🎓 Student: +233202222222
- 🛵 Rider: +233203333333

In DEV mode, OTPs are logged to the terminal — no SMS is actually sent.
