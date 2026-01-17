# Ruta App Demo

A high-fidelity interactive demo of a mobile-first web app built with Next.js.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **shadcn/ui** components
- **Framer Motion** for animations

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Mobile-first responsive design (optimized for iPhone screen size)
- Smooth page transitions with Framer Motion
- Bottom navigation bar with active state indicators
- AppShell component that provides consistent layout across pages
- Placeholder demo pages ready for feature implementation

## Project Structure

```
app/
  ├── layout.tsx      # Root layout
  ├── page.tsx        # Home page
  ├── create/         # Create page
  ├── profile/        # Profile page
  └── settings/       # Settings page

components/
  ├── AppShell.tsx    # Main app shell with navigation
  └── ui/             # shadcn/ui components
```
