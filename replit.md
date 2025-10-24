# Survivor Support Platform

## Overview

This is a secure, invite-only platform designed specifically for survivors of human trafficking. The platform provides access to essential support services with a focus on safety, privacy, and dignity. Built with a subscription-based model ($1/month with grandfathered pricing), it features comprehensive user management, payment tracking, and a flexible product catalog for various support services.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type-safe component development
- Vite for fast development and optimized production builds
- Wouter for lightweight client-side routing
- TanStack Query for server state management and data fetching

**UI Framework:**
- shadcn/ui component library with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design system
- WCAG AAA accessibility compliance with focus on trauma-informed design
- No parallax or scroll animations to maintain predictable interface for vulnerable users

**Design Principles:**
- Accessibility-first design system
- Trust through clarity and transparency
- Calm progression without overwhelming elements
- Inter font family for body/headings, JetBrains Mono for codes/payments
- Mobile-first responsive design with breakpoints at md (768px), lg (1024px), xl (1280px)

**State Management:**
- TanStack Query for server state with custom query client configuration
- Query functions with 401 handling for authentication flows
- Session-based authentication state through Replit Auth

### Backend Architecture

**Core Framework:**
- Express.js server with TypeScript
- Session-based authentication using Replit OpenID Connect
- RESTful API design with `/api` prefix convention

**Authentication System:**
- Replit Auth integration via OpenID Connect with Passport.js strategy
- Session storage in PostgreSQL using connect-pg-simple
- Role-based access control with `isAuthenticated` and `isAdmin` middleware
- User session management with 1-week session TTL
- Invite-only registration system with unique redemption codes

**API Architecture:**
- Modular route registration through `registerRoutes` function
- Consistent error handling with JSON responses
- Request logging middleware for API endpoints
- Admin action logging for accountability and audit trails

**Business Logic Layers:**
- Storage abstraction layer (IStorage interface) for database operations
- Separation of concerns between routes, storage, and database access
- Grandfathered pricing tier system for subscription management

### Data Storage Solutions

**Database:**
- PostgreSQL via Neon serverless with WebSocket support
- Drizzle ORM for type-safe database operations
- Schema-first development with migrations in `/migrations` directory

**Schema Design:**

**Core Tables:**
- `users` - User profiles with authentication data, subscription status, pricing tier, admin flags
- `sessions` - Express session storage (required for Replit Auth)
- `inviteCodes` - Admin-generated invite codes with usage tracking and expiration
- `pricingTiers` - Grandfathered pricing model with effectiveDate and isCurrentTier flags
- `payments` - Payment transaction history linked to users
- `products` - Service catalog with JSON field for type-specific attributes
- `adminActionLogs` - Audit trail for all administrative actions

**Key Schema Features:**
- Drizzle-zod integration for runtime validation of inserts
- Relational mapping using Drizzle relations API
- UUID primary keys with automatic generation
- Timestamp tracking (createdAt, updatedAt) on core entities
- Flexible product schema with JSON attributes for service-specific data

**Data Access Pattern:**
- Repository pattern via storage module with interface-based operations
- CRUD operations abstracted from route handlers
- Transaction support through Drizzle ORM connection pooling

### Authentication and Authorization

**Authentication Flow:**
1. Replit OpenID Connect for identity verification
2. Session creation in PostgreSQL with secure HTTP-only cookies
3. User record creation/update in users table
4. Invite code validation for first-time users (non-admin)

**Authorization Levels:**
- Unauthenticated: Access to landing page only
- Authenticated without invite: Restricted to invite code redemption page
- Authenticated with invite: Access to all user features
- Admin users: Access to admin dashboard and management functions

**Security Measures:**
- HTTPS-only cookies with httpOnly flag
- 1-week session expiration with automatic cleanup
- Admin action logging for accountability
- Invite code system prevents unauthorized registrations

### External Dependencies

**Third-Party Services:**
- Replit Auth (OpenID Connect) - Primary authentication provider
- Neon Database - Serverless PostgreSQL hosting
- Google Fonts - Inter and JetBrains Mono font families

**Key NPM Packages:**
- `@neondatabase/serverless` - Neon database client with WebSocket support
- `drizzle-orm` and `drizzle-kit` - ORM and migration tooling
- `openid-client` - OAuth/OIDC client library
- `passport` - Authentication middleware
- `connect-pg-simple` - PostgreSQL session store
- `@tanstack/react-query` - Data synchronization and caching
- `@radix-ui/*` - Accessible UI primitives (20+ components)
- `tailwindcss` - Utility-first CSS framework
- `zod` - Schema validation library
- `wouter` - Lightweight routing library

**Development Tools:**
- `vite` - Build tool and dev server
- `tsx` - TypeScript execution for development
- `esbuild` - Production bundling
- `@replit/vite-plugin-*` - Replit-specific development enhancements

## Mini-Apps Architecture

The platform uses a WeChat-style super app architecture where each service is implemented as a separate integrated mini-app. Each mini-app has its own database tables, API routes, and frontend pages while sharing the core platform authentication and user management.

### Implemented Mini-Apps

**1. SupportMatch - Accountability Partner Matching**
*Status: Fully implemented and tested*

An accountability partner matching system designed specifically for trauma survivors in recovery. Features include:

**Core Features:**
- User profile creation with gender preferences and timezone
- Algorithmic matching based on timezone, gender preferences, and availability (removes bias)
- 1:1 partnership messaging with real-time updates
- Safety features: user exclusions and reporting system
- Platform announcements with targeted delivery
- Partnership history tracking

**Matching Algorithm:**
The system uses an unbiased algorithmic approach to create partnerships:
- Matches users without active partnerships
- Ensures bidirectional gender preference compatibility
- Prioritizes same timezone matches
- Respects mutual exclusions
- Uses a greedy algorithm with scoring for optimal matching

**Database Schema (6 tables):**
- `support_match_profiles` - User profiles (nickname, gender, genderPreference, timezone, isActive)
- `partnerships` - 1:1 partnerships (user1Id, user2Id, startDate, endDate, status)
- `messages` - Partnership messaging (partnershipId, senderId, content, createdAt)
- `exclusions` - User exclusion list (userId, excludedUserId)
- `reports` - Safety reports (reporterId, reportedUserId, reason, status)
- `announcements` - Platform announcements (title, content, type, showOnLogin, expiresAt)

**API Endpoints:**
- Profile CRUD: GET/POST/PUT `/api/supportmatch/profile`
- Partnership management: GET `/api/supportmatch/partnership/active`, GET `/api/supportmatch/partnership/history`
- Messaging: GET/POST `/api/supportmatch/messages/:partnershipId`
- Safety: POST `/api/supportmatch/exclusions`, POST `/api/supportmatch/reports`
- Admin: GET `/api/supportmatch/admin/stats`, POST `/api/supportmatch/admin/partnerships`
- Announcements: GET/POST/PUT/DELETE `/api/supportmatch/announcements`

**Frontend Pages:**
- `/apps/supportmatch` - Dashboard with partnership status and quick actions
- `/apps/supportmatch/profile` - Profile creation and editing
- `/apps/supportmatch/partnership` - Active partnership messaging (5-second polling)
- `/apps/supportmatch/announcements` - Platform announcements
- `/apps/supportmatch/history` - Past partnerships
- `/apps/supportmatch/admin` - Admin management panel

**Technical Implementation:**
- Form state management with react-hook-form and zod validation
- useEffect-based form.reset() pattern for async data loading
- TanStack Query for data fetching with proper cache invalidation
- Real-time messaging simulation via interval-based refetch
- Shadcn UI components with accessibility compliance
- Comprehensive test coverage via Playwright e2e tests

**Navigation:**
- User sidebar: "SupportMatch" link (UserCheck icon)
- Admin sidebar: "SupportMatch Admin" link

**2. SleepStories - Calming Audio Content Platform**
*Status: Fully implemented*

A Calm-style audio story platform providing soothing bedtime stories and meditation content to help survivors relax and sleep. Features Wistia-hosted audio with embedded player and offline download capability.

**Core Features:**
- Wistia video platform integration for reliable audio hosting
- Embedded audio player with responsive design
- Offline download support for accessibility
- Category-based organization (nature, fantasy, meditation, bedtime, general)
- Admin content management with metadata editing
- Thumbnail support for visual browsing

**Database Schema (1 table):**
- `sleep_stories` - Audio content library (title, description, wistiaMediaId, duration, category, downloadUrl, thumbnailUrl, isActive, createdAt, updatedAt)

**API Endpoints:**
- User endpoints: GET `/api/sleepstories` (active stories), GET `/api/sleepstories/:id` (single story)
- Admin endpoints: GET `/api/sleepstories/admin/all`, POST `/api/sleepstories/admin`, PUT `/api/sleepstories/admin/:id`, DELETE `/api/sleepstories/admin/:id`

**Frontend Pages:**
- `/apps/sleepstories` - Library view with category badges and duration display
- `/apps/sleepstories/:id` - Audio player page with Wistia embed and download option
- `/apps/sleepstories/admin` - Admin management panel for CRUD operations

**Technical Implementation:**
- Wistia embed API with responsive padding for audio-only content
- Form validation with zod for duration (seconds) and Wistia media ID
- Category color coding with dark mode support
- Duration formatting helper (minutes/hours display)
- Admin action logging for all content changes

**Navigation:**
- User sidebar: "Sleep Stories" link (Moon icon)
- Admin sidebar: "Sleep Stories Admin" link

**3. LightHouse - Housing Matching Platform**
*Status: Fully implemented*

An Airbnb-style housing matching platform connecting survivors seeking housing with hosts offering safe, affordable housing options. Features property listings, match requests, and review system.

**Core Features:**
- Profile creation for seekers (need housing) and hosts (offer housing)
- Property listing with photos, amenities, and detailed information
- Match request system with messaging between seekers and hosts
- Property reviews and ratings for transparency
- Budget range filtering for seekers
- Admin oversight of all matches and properties

**Database Schema (4 tables):**
- `lighthouse_profiles` - User profiles (profileType, displayName, bio, phoneNumber, housingNeeds, moveInDate, budgetMin, budgetMax, hasProperty, isActive)
- `lighthouse_properties` - Housing listings (hostId, title, description, propertyType, address, city, state, zipCode, bedrooms, bathrooms, monthlyRent, availableFrom, amenities, photos, housingRules, isActive)
- `lighthouse_matches` - Match requests (seekerId, propertyId, status, seekerMessage, hostResponse, proposedMoveInDate, actualMoveInDate)
- `lighthouse_reviews` - Property reviews (reviewerId, propertyId, rating, comment)

**API Endpoints:**
- Profile: GET/POST/PUT `/api/lighthouse/profile`
- Properties: GET `/api/lighthouse/properties`, GET `/api/lighthouse/properties/:id`
- Matches: GET/POST `/api/lighthouse/matches`, PUT `/api/lighthouse/matches/:id`
- Admin: GET `/api/lighthouse/admin/stats`, GET `/api/lighthouse/admin/properties`, GET `/api/lighthouse/admin/matches`

**Frontend Pages:**
- `/apps/lighthouse/profile` - Profile creation and editing (seeker or host)
- `/apps/lighthouse/browse` - Browse available properties with filters
- `/apps/lighthouse/property/:id` - Property detail page with match request form
- `/apps/lighthouse/matches` - View and manage match requests
- `/apps/lighthouse/admin` - Admin dashboard with platform statistics

**Technical Implementation:**
- Form validation with react-hook-form and zod for profile/property data
- Property type badges with color coding (room, apartment, community)
- Match status tracking (pending, accepted, rejected, completed, cancelled)
- Image gallery support for property photos
- Budget range inputs for seeker profiles
- Admin action logging for all housing-related actions

**Navigation:**
- User sidebar: "LightHouse" link (Building2 icon)
- Admin sidebar: "LightHouse Admin" link

### Planned Mini-Apps

The system is designed to support 13+ additional service types:
- Emergency Housing
- Transitional Housing
- Permanent Housing
- Individual Therapy
- Group Therapy
- Family Therapy
- Crisis Counseling
- Medical Care
- Dental Care
- Mental Health Services
- Legal Advocacy
- Case Management
- Job Training
- Life Skills
- Education Support

Each mini-app will follow the same architecture pattern as SupportMatch and SleepStories, with dedicated database tables, API routes, and frontend pages.