# Wishbox WebApp

Web app for the Wishbox platform, sharing domain logic and design tokens with the mobile app.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4** — design tokens mirrored from `wishbox-mobile/src/theme.ts`
- **Firebase** (Auth + Storage)

## Requirements

- Node.js 20+
- npm 10+

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in the values:

| Variable                                   | Description                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                      | API base URL. Default for this workspace: `https://api-dev.appwishbox.com` |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase Web API key                                                       |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase Auth domain                                                       |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase project ID                                                        |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase Storage bucket                                                    |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID                                               |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase app ID                                                            |
| `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL`   | Optional — Firebase Auth emulator URL for local testing                    |

## Project structure

```
app/                  # Routes and layouts (Next.js App Router)
components/           # Feature components (Cards, Screen, Toast, sheets...)
  ui/                  # Base UI kit (Button, Card, Field, ...)
lib/                   # Domain logic shared with the mobile app
  data/                # Types and sample data
  api.ts               # Backend API client
  firebase.ts          # Firebase (web persistence)
  theme.ts             # Design tokens
hooks/                 # Reusable hooks (use-list-actions, ...)
store/                 # Global state (WishboxProvider)
```

## Available scripts

```bash
npm run dev      # start the dev server (Turbopack)
npm run build    # production build
npm run start    # run the production build
npm run lint     # run ESLint
```
