# 🍚 CampusBite — Student Food Delivery App

> "Your Campus Kitchen, Delivered" — Built for UPSA, Accra, Ghana

A full-stack food delivery platform connecting UPSA students with local food vendors, powered by MTN MoMo payments, real-time GPS tracking, and a loyalty rewards system.

## 📁 Project Structure

```
Fresh_rice/
├── backend/          # Node.js + Express + PostgreSQL API
├── student-app/      # React Native + Expo (Student mobile app)
├── vendor-dashboard/ # React.js + Tailwind (Vendor web dashboard)
└── rider-app/        # React Native + Expo (Rider mobile app)
```

## 🚀 Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/Joe-saki/Fresh_rice.git
cd Fresh_rice
```

### 2. Backend
```bash
cd backend && cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

### 3. Student App
```bash
cd student-app && npm install && npx expo start
```

### 4. Vendor Dashboard
```bash
cd vendor-dashboard && npm install && npm run dev
```

### 5. Rider App
```bash
cd rider-app && npm install && npx expo start
```

## 🛠 Tech Stack
| Layer | Technology |
|-------|-----------|
| Mobile Apps | React Native + Expo |
| Web Dashboard | React.js + Tailwind CSS |
| Backend API | Node.js + Express.js |
| Database | PostgreSQL + Prisma ORM |
| Payments | Hubtel API (MTN MoMo) |
| SMS | Arkesel |
| Maps | Google Maps API |
| Real-time | Socket.io |
| Hosting | Railway.app |
