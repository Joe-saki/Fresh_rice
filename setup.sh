#!/bin/bash
echo "🍚 Setting up CampusBite..."
echo ""

# Backend
echo "📦 Installing backend dependencies..."
cd backend && npm install
echo "✅ Backend dependencies installed"
echo ""

# Student App
echo "📱 Installing student app dependencies..."
cd ../student-app && npm install
echo "✅ Student app ready"
echo ""

# Vendor Dashboard
echo "💻 Installing vendor dashboard dependencies..."
cd ../vendor-dashboard && npm install
echo "✅ Vendor dashboard ready"
echo ""

# Rider App
echo "🛵 Installing rider app dependencies..."
cd ../rider-app && npm install
echo "✅ Rider app ready"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy backend/.env.example to backend/.env and fill in your values"
echo "2. Run database migrations: cd backend && npx prisma migrate dev --name init"
echo "3. Seed the database: cd backend && node prisma/seed.js"
echo "4. Start the backend: cd backend && npm run dev"
echo "5. Start student app: cd student-app && npx expo start"
echo "6. Start vendor dashboard: cd vendor-dashboard && npm run dev"
echo "7. Start rider app: cd rider-app && npx expo start"
