<p align="center">
  <img src="./uploads/img/hyf1.png" alt="HypeForm Banner" width="100%">
</p>
<h1 align="center">🔥 HypeForm</h1>
<p align="center">
  <strong>Modern, Beautiful Form Builder SaaS Platform</strong>
  <br>
  Build forms that people love to fill. No coding required.
  <br><br>
  <a href="https://liveupx.com">Created by Liveupx.com</a>
</p>
<p align="center">
  <a href="https://github.com/liveupx/hype-form/stargazers"><img src="https://img.shields.io/github/stars/liveupx/hype-form?style=for-the-badge&logo=github&color=f59e0b" alt="Stars"></a>
  <a href="https://github.com/liveupx/hype-form/network/members"><img src="https://img.shields.io/github/forks/liveupx/hype-form?style=for-the-badge&logo=github&color=22c55e" alt="Forks"></a>
  <a href="https://github.com/liveupx/hype-form/issues"><img src="https://img.shields.io/github/issues/liveupx/hype-form?style=for-the-badge&logo=github&color=ef4444" alt="Issues"></a>
  <a href="https://github.com/liveupx/hype-form/blob/main/LICENSE"><img src="https://img.shields.io/github/license/liveupx/hype-form?style=for-the-badge&color=3b82f6" alt="License"></a>
</p>
<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-339933?style=flat-square&logo=node.js" alt="Node">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express" alt="Express">
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat-square&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker" alt="Docker">
</p>
<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-integrations">Integrations</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-sponsors">Sponsors</a>
</p>

📸 Screenshots
<p align="center">
  <img src="./uploads/img/hyf1.png" alt="Dashboard" width="45%">
  <img src="./uploads/img/hyf2.png" alt="Form Builder" width="45%">
</p>
<p align="center">
  <img src="./uploads/img/hyf3.png" alt="Templates" width="45%">
  <img src="./uploads/img/hyf4.png" alt="Analytics" width="45%">
</p>
<p align="center">
  <img src="./uploads/img/hyf5.png" alt="Public Form" width="60%">
</p>

✨ Features
🎨 Form Builder

Drag & Drop Interface - Build forms visually with intuitive controls
25+ Field Types - Text, email, phone, date, rating, NPS, file upload, payment, and more
Conditional Logic - Show/hide fields based on previous answers
Custom Themes - Match forms to your brand identity
Mobile Responsive - Forms look great on all devices

📊 Analytics & Insights

Real-time Dashboard - Views, starts, completions, conversion rates
Submission Tracking - Monitor responses as they come in
AI-Powered Analysis - Sentiment analysis and theme detection
Export Options - Download as CSV or JSON

🔗 Integrations (8 Built-in)

Mailchimp - Sync to email lists
Notion - Add to databases
Discord - Channel notifications
HubSpot - CRM sync
Airtable - Spreadsheet sync
Twilio - SMS notifications
Zapier - Connect 5000+ apps
OpenAI - AI form generation

🔐 Enterprise Ready

Team Collaboration - Multiple users per workspace
Role-Based Access - Admin, editor, viewer roles
Audit Logs - Track all changes
SSO Support - Google, Slack OAuth
Webhook Security - HMAC signatures

💳 Monetization

Stripe Integration - Collect payments in forms
Subscription Plans - Free, Pro, Enterprise tiers
Usage-Based Billing - Pay as you grow


🚀 Quick Start
Prerequisites

Node.js 18+
PostgreSQL 14+
npm or yarn

Installation
bash# Clone the repository
git clone https://github.com/liveupx/hype-form.git
cd hype-form

# Install dependencies
npm install
cd client && npm install && cd ..

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET (min 32 chars)

# Setup database
npx prisma generate
npx prisma migrate dev

# Seed sample data (optional)
npm run db:seed

# Start development servers
npm run dev
Access the app:

🌐 Frontend: http://localhost:3000
🔧 Backend API: http://localhost:5000

🐳 Docker
bash# Start with Docker Compose
docker-compose up -d

# Access at http://localhost:5000

🔗 Integrations
IntegrationTypeDescription📧 MailchimpEmail MarketingSync subscribers to email lists📝 NotionProductivityCreate database entries from submissions💬 DiscordCommunicationSend rich notifications to channels🔶 HubSpotCRMCreate contacts and deals automatically📊 AirtableProductivityAdd rows to Airtable bases📱 TwilioSMSSend text message notifications⚡ ZapierAutomationConnect to 5000+ apps🤖 OpenAIAIGenerate forms with AI, analyze responses📗 Google SheetsProductivitySync to spreadsheets💼 SlackCommunicationTeam notifications💳 StripePaymentsCollect payments in forms

🛠️ Tech Stack
Frontend
TechnologyPurpose⚛️ React 18UI Framework⚡ ViteBuild Tool🎨 Tailwind CSSStyling🎭 Framer MotionAnimations🔀 React RouterRouting🐻 ZustandState Management📊 RechartsCharts🔌 Socket.io ClientReal-time
Backend
TechnologyPurpose🟢 Node.jsRuntime🚂 Express.jsWeb Framework🔷 PrismaORM🐘 PostgreSQLDatabase🔴 RedisCaching🔐 JWTAuthentication📡 Socket.ioReal-time📝 WinstonLogging
DevOps
TechnologyPurpose🐳 DockerContainerization🔄 GitHub ActionsCI/CD☁️ AWS S3File Storage

📁 Project Structure
hypeform/
├── 📦 package.json           # Root dependencies & scripts
├── 📋 .env.example           # Environment template
├── 🐳 Dockerfile             # Production build
├── 🐳 docker-compose.yml     # Docker setup
│
├── 📂 prisma/
│   ├── schema.prisma         # Database models (15+ tables)
│   └── seed.js               # Sample data
│
├── 📂 server/
│   ├── index.js              # Express entry point
│   ├── 📂 routes/            # API endpoints (13 route files)
│   │   ├── auth.js           # Authentication
│   │   ├── forms.js          # Form CRUD
│   │   ├── fields.js         # Field management
│   │   ├── submissions.js    # Response handling
│   │   ├── integrations.js   # Third-party connections
│   │   ├── analytics.js      # Stats & trends
│   │   ├── billing.js        # Stripe integration
│   │   └── ...
│   ├── 📂 middleware/        # Auth, error handling
│   ├── 📂 services/          # Integration engines
│   │   └── integrations/     # 8 integration services
│   └── 📂 utils/             # Logger, helpers
│
├── 📂 client/
│   ├── 📂 src/
│   │   ├── App.jsx           # Main app & routing
│   │   ├── 📂 pages/         # All page components
│   │   ├── 📂 layouts/       # Dashboard & public layouts
│   │   ├── 📂 stores/        # Zustand state
│   │   └── 📂 utils/         # API client
│   └── index.html
│
└── 📂 uploads/               # File storage

🔧 Scripts
bash# Development
npm run dev          # Start frontend + backend

# Database
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio

# Production
npm run build        # Build for production
npm start            # Start production server

# Testing
npm test             # Run tests
npm run lint         # Lint code

🔐 Demo Accounts
After running npm run db:seed:
RoleEmailPassword👑 Adminadmin@hypeform.ioadmin123!👤 Userdemo@hypeform.iodemo123!

💰 Plans & Pricing
FeatureFreePro ($10/mo)Enterprise ($99/mo)FormsUnlimitedUnlimitedUnlimitedResponsesUnlimitedUnlimitedUnlimitedStorage100 MB10 GBUnlimitedTeam Members15UnlimitedWebhooks1UnlimitedUnlimitedRemove Branding❌✅✅Payment Collection❌✅✅AI Features❌✅✅API Access❌✅✅SSO❌❌✅Audit Logs❌❌✅Priority Support❌❌✅

🤝 Contributing
We love contributions! HypeForm is open source and we welcome developers of all skill levels.
How to Contribute

🍴 Fork the repository
🔀 Create a feature branch (git checkout -b feature/amazing-feature)
💻 Code your changes
✅ Test your changes
📝 Commit (git commit -m 'Add amazing feature')
🚀 Push (git push origin feature/amazing-feature)
🔃 Open a Pull Request

Good First Issues
Look for issues tagged with good first issue - they're perfect for newcomers!
Show Image
What We're Looking For

🐛 Bug fixes
✨ New features
📝 Documentation improvements
🌍 Translations
🧪 Test coverage
🎨 UI/UX improvements


💖 Sponsors
<p align="center">
  <strong>HypeForm is free and open source. Support the project by becoming a sponsor!</strong>
</p>
Why Sponsor?

💝 Support open source development
🚀 Help us add more features
📣 Get your logo on our README
🎯 Priority feature requests
💬 Direct support channel

Sponsor Tiers
TierAmountBenefits☕ Backer$5/moName in README🥉 Bronze$25/moSmall logo + Twitter shoutout🥈 Silver$100/moMedium logo + Priority issues🥇 Gold$500/moLarge logo + Feature priority + Direct support💎 Platinum$1000/moEverything + Custom development
<p align="center">
  <a href="https://github.com/sponsors/liveupx">
    <img src="https://img.shields.io/badge/Sponsor-❤️-ea4aaa?style=for-the-badge&logo=github" alt="Sponsor">
  </a>
  <a href="https://www.buymeacoffee.com/liveupx">
    <img src="https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black" alt="Buy Me A Coffee">
  </a>
  <a href="https://ko-fi.com/liveupx">
    <img src="https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Ko-fi">
  </a>
</p>
Current Sponsors
<p align="center">
  <i>Be the first to sponsor HypeForm! Your logo will appear here.</i>
</p>
<!-- SPONSORS:START -->
<!-- Add sponsor logos here -->
<!-- SPONSORS:END -->

👥 Looking for Collaborators
<p align="center">
  <strong>We're actively looking for collaborators to help build HypeForm!</strong>
</p>
Open Positions
RoleSkillsStatus🎨 UI/UX DesignerFigma, Design Systems🟢 Open⚛️ Frontend DeveloperReact, TypeScript🟢 Open🔧 Backend DeveloperNode.js, PostgreSQL🟢 Open📱 Mobile DeveloperReact Native🟢 Open📝 Technical WriterDocumentation🟢 Open🧪 QA EngineerTesting, Automation🟢 Open🌍 TranslatorMultiple Languages🟢 Open📣 Developer AdvocateCommunity, Content🟢 Open
How to Join

⭐ Star this repository
👀 Check the open issues
💬 Comment on an issue you'd like to work on
📧 Email us at hello@liveupx.com

What You Get

🏆 Recognition as a core contributor
📜 Certificate of contribution
🎁 Exclusive swag (stickers, t-shirts)
🔗 LinkedIn recommendation
💼 Portfolio piece for your career


🌟 Star History
<p align="center">
  <a href="https://star-history.com/#liveupx/hype-form&Date">
    <img src="https://api.star-history.com/svg?repos=liveupx/hype-form&type=Date" alt="Star History Chart">
  </a>
</p>

📜 License
This project is licensed under the MIT License - see the LICENSE file for details.
MIT License

Copyright (c) 2024 Liveupx.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...

🙏 Acknowledgments

Typeform - Design inspiration
Tally - Feature inspiration
shadcn/ui - UI components
All our amazing contributors


📞 Contact & Support
<p align="center">
  <a href="https://liveupx.com">
    <img src="https://img.shields.io/badge/Website-liveupx.com-f59e0b?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Website">
  </a>
  <a href="https://twitter.com/liveupx">
    <img src="https://img.shields.io/badge/Twitter-@liveupx-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter">
  </a>
  <a href="https://discord.gg/liveupx">
    <img src="https://img.shields.io/badge/Discord-Join%20Us-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord">
  </a>
  <a href="mailto:hello@liveupx.com">
    <img src="https://img.shields.io/badge/Email-hello@liveupx.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Email">
  </a>
</p>

<p align="center">
  <strong>If you find HypeForm useful, please consider giving it a ⭐️</strong>
  <br><br>
  Made with ❤️ by <a href="https://liveupx.com">Liveupx.com</a>
</p>

<!-- TAGS/KEYWORDS (for GitHub search) -->
<!-- 
form-builder, forms, survey, typeform-alternative, open-source, saas, react, nodejs, 
express, postgresql, prisma, tailwindcss, form-creator, drag-and-drop, no-code, 
low-code, zapier, integrations, webhooks, analytics, ai-powered, stripe, payments,
mailchimp, notion, discord, hubspot, airtable, twilio, openai, form-analytics,
submission-management, team-collaboration, enterprise, self-hosted
-->
