# 🔥 HypeForm

Modern Form Builder SaaS Platform by [Liveupx.com](https://liveupx.com)


## 📸 Application Screenshots

### Screenshot 1
![Screenshot 1](./uploads/img/hyf1.png)

### Screenshot 2
![Screenshot 2](./uploads/img/hyf2.png)

### Screenshot 3
![Screenshot 3](./uploads/img/hyf3.png)

### Screenshot 4
![Screenshot 4](./uploads/img/hyf4.png)

### Screenshot 5
![Screenshot 5](./uploads/img/hyf5.png)

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

# 1. Unzip
unzip hypeform-final.zip
cd hypeform-final

# 2. Create .env
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET

# 3. Install
npm install
cd client && npm install && cd ..

# 4. Database setup
npx prisma generate
npx prisma migrate dev
npm run db:seed

# 5. Run
npm run dev
```

## 🔐 Demo Accounts

After running `npm run db:seed`:
- **Admin:** admin@hypeform.io / admin123!
- **User:** demo@hypeform.io / demo123!


## 📝 License

MIT - [Liveupx.com](https://liveupx.com)
