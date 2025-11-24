# psyop-free ecosystem

## Overview

This secure, invite-only platform provides essential support services for survivors of human trafficking. It operates on a subscription model, offering comprehensive user management, payment tracking, and a flexible product catalog for various support services. The platform prioritizes safety, privacy, dignity, and accessibility, aiming to empower survivors through a trauma-informed design approach. Key features include an accountability partner matching system (SupportMatch) and a housing matching service (LightHouse), with an architecture designed to support numerous additional mini-applications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is built with React and TypeScript, using Vite for development and optimized builds. Wouter handles routing, and TanStack Query manages server state. The UI leverages shadcn/ui with Radix UI primitives and Tailwind CSS for styling, adhering to WCAG AAA accessibility standards. Design principles emphasize clarity, transparency, and a calm user experience, avoiding distracting animations. It features a mobile-first responsive design and a carefully chosen color scheme with primary green (#4ade80 - HSL 142 65% 30% light, 142 60% 55% dark) and warm canvas/tan background (HSL 40 25% 97%) to reduce eye strain while meeting WCAG 4.5:1 contrast requirements.

### Backend

The backend utilizes an Express.js server with TypeScript, implementing a RESTful API design. Authentication is managed via Replit Auth (OpenID Connect) with Passport.js and session storage in PostgreSQL. A robust role-based access control system includes `isAuthenticated` and `isAdmin` middleware, complemented by an invite-only registration process. The architecture promotes modularity with separate business logic layers for routes, storage, and database interactions, supporting grandfathered pricing tiers.

### Data Storage

PostgreSQL, hosted on Neon serverless, is the primary database, managed with Drizzle ORM for type-safe operations and schema migrations. The schema includes core tables for users, sessions, invite codes, pricing tiers, payments, products, and admin action logs. It incorporates Drizzle-zod for runtime validation, UUID primary keys, and timestamp tracking. A repository pattern abstracts data access, ensuring separation of concerns and transactional support.

### Authentication and Authorization

The authentication flow integrates Replit OpenID Connect for identity verification, creating secure, HTTP-only cookie-based sessions in PostgreSQL. Authorization levels dictate access: unauthenticated users access only the landing page (which includes a Signal group link for requesting invite codes: https://signal.group/#CjQKILHj7074l2Kl-oYy0qGSFdydXbtu0Pf66Z_88K9IlSCtEhDDdqV_BFAW2qm2EiTGEaNs), authenticated users without an invite are restricted to redemption, authenticated users with an invite gain full user features, and admin users access a dedicated dashboard. Security measures include HTTPS-only cookies, session expiration, and admin action logging.

### Mini-Apps Architecture

The platform employs a WeChat-style super app architecture, where each service operates as an independent mini-app sharing core platform functionalities.

**Implemented Mini-Apps:**

1.  **SupportMatch:** An accountability partner matching system for trauma survivors. It features algorithmic matching based on user preferences, 1:1 messaging, safety features (exclusions, reporting), and partnership history tracking.
2.  **LightHouse:** An Airbnb-style housing matching platform connecting survivors with safe housing options. It includes a dashboard entry point (`/apps/lighthouse`) that conditionally displays content based on profile type (seeker vs. host), seeker/host profiles, property listings with detailed information, and a match request system. The dashboard shows welcome screens for new users, stats and quick actions for seekers (browse properties, view match requests), and host-specific tools (manage properties, view incoming requests).

Each mini-app has its dedicated database tables, API routes, and frontend pages, adhering to consistent architectural patterns and leveraging shared platform features like authentication and user management.

## External Dependencies

-   **Replit Auth:** Primary authentication provider (OpenID Connect).
-   **Neon Database:** Serverless PostgreSQL hosting.
-   **Google Fonts:** Inter and JetBrains Mono font families.