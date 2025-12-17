# 🔥 HypeForm

Modern Form Builder SaaS Platform by [Liveupx.com](https://liveupx.com)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
# 1. Install dependencies
npm install
cd client && npm install && cd ..

# 2. Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# 3. Setup database
npx prisma generate
npx prisma migrate dev
npm run db:seed  # Optional: sample data

# 4. Start development
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### Docker

```bash
docker-compose up -d
```

## 📁 Project Structure

```
hypeform/
├── package.json          # Root dependencies
├── .env.example          # Environment template
├── Dockerfile            # Production build
├── docker-compose.yml    # Docker setup
├── prisma/
│   ├── schema.prisma     # Database models
│   └── seed.js           # Sample data
├── server/
│   ├── index.js          # Express entry
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth, errors
│   └── utils/            # Logger
└── client/
    ├── src/
    │   ├── App.jsx       # Main app
    │   ├── pages/        # Page components
    │   ├── layouts/      # Layouts
    │   ├── stores/       # Zustand state
    │   └── utils/        # API helpers
    └── index.html
```

## 🔧 Scripts

```bash
npm run dev          # Start dev servers
npm run build        # Build for production
npm start            # Start production
npm run db:migrate   # Run migrations
npm run db:seed      # Seed sample data
npm run db:studio    # Prisma Studio
```

## 🔐 Demo Accounts

After running `npm run db:seed`:
- **Admin:** admin@hypeform.io / admin123!
- **User:** demo@hypeform.io / demo123!

## 📝 License

MIT - [Liveupx.com](https://liveupx.com)
