# 🎨 Canva Clone - Full-Featured Graphic Design SaaS Platform

<img width="5706" height="1806" alt="canva-clone" src="/canva-clone (2).png" />

A production-ready graphic design SaaS platform with an intuitive drag-and-drop editor, AI-powered features, and complete subscription management. Built with Next.js 14, Fabric.js canvas engine, Replicate AI, and Stripe payments.

---
## DEMO
https://canva-clone-two-gray.vercel.app/


## 🚀 Quick Start


## ✨ Key Features

- 🎨 **Professional Design Editor** - Templates, text, shapes, drawing tools, and layers
- 🤖 **AI-Powered Tools** - Image generation and background removal
- 🔐 **Multi-Auth** - Google, GitHub, and Email/Password
- 💳 **Stripe Subscriptions** - Complete payment management
- 📤 **Export Options** - PNG, JPG, SVG, JSON
- 📱 **Fully Responsive** - Works on all devices
- 🔍 **Project Management** - Create and organize multiple projects
- 🎯 **Unsplash Integration** - Millions of free stock photos

---

## 🛠️ Tech Stack

**Frontend:** Next.js 14, React 18, TypeScript, TailwindCSS, Shadcn UI, Fabric.js  
**Backend:** Hono.js, Drizzle ORM, Neon PostgreSQL, Auth.js  
**AI & Media:** Replicate AI, Unsplash, UploadThing  
**Payments:** Stripe  
**State:** Zustand, TanStack Query

---

## 📋 Prerequisites

Before starting, you need:
- Node.js (v18+) or Bun
- Git
- Free accounts for: Neon, UploadThing, Replicate, Unsplash, Stripe, Google, GitHub


---

## 📦 Quick Commands

```bash
# Install dependencies
npm install

# Setup database
npm run db:generate
npm run db:migrate

# Start development
npm run dev

# Open database GUI
npm run db:studio
```


## 🔧 Environment Variables

Create a `.env` file with these variables:

```env
DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
UPLOADTHING_TOKEN=
REPLICATE_API_TOKEN=
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```




## 💎 Pro Features

Unlock with subscription:
- ✨ Unlimited projects
- 🎨 Premium templates
- 🤖 Unlimited AI generations
- 📤 High-resolution exports
- 💾 Priority support

---

## 🎓 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs)
- [Auth.js Documentation](https://authjs.dev/)
- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [Stripe Documentation](https://stripe.com/docs)
- [Replicate Documentation](https://replicate.com/docs)

---

## 🙏 Credits


**Deployment:** [Vercel](https://vercel.com/)  
**UI Components:** [Shadcn](https://ui.shadcn.com/)

---
