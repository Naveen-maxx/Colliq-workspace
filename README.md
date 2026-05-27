# Colliq Workspace

**Tagline:** Work Together. Instantly.

Colliq Workspace is a modern real-time collaborative document workspace platform, built with an emphasis on a premium, spacious, and highly-polished user experience.

## Project Overview

The goal of Colliq is to build a "premium next-generation collaborative writing workspace." It is inspired by the aesthetics of Notion, Pitch, and Linear, serving as a reimagined Google Docs with modern startup UX.

## Tech Stack

**Frontend:**

- React 19 (TypeScript)
- TanStack Router & Start
- Tailwind CSS v4
- Framer Motion (for fluid micro-interactions)
- TipTap Editor (Headless Rich Text Editor)

**Backend (Firebase):**

- Firebase Authentication
- Cloud Firestore (for scalable document persistence)

## Setup Instructions

### Environment Variables

To run Colliq Workspace locally, you need a Firebase project.

1. Clone the repository.
2. Duplicate `.env.example` and rename it to `.env`.
3. Add your Firebase web configuration credentials to `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Run Locally

Install the dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

### Build for Production

To build the application for deployment:

```bash
npm run build
```

## Folder Structure

- `src/components/` - Reusable UI elements and editor components.
- `src/contexts/` - Global state and Authentication contexts.
- `src/firebase/` - Firebase initialization and scalable Firestore architecture.
- `src/hooks/` - Custom React hooks.
- `src/routes/` - TanStack Router page definitions.

## Roadmap Summary

- **Phase 1:** Core UI & Authentication (Completed)
- **Phase 2:** Editor Polish & Rich Text Foundation (Completed)
- **Phase 3:** Firestore Document Persistence
- **Phase 4:** Real-Time Multiplayer Collaboration
- **Phase 5:** AI Editing Assistance
