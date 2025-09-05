# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a retail AI management system with both web and mobile applications. The system uses Supabase as the backend with Edge Functions for API endpoints, React with Vite for the web frontend, and React Native with Expo for mobile.

## Architecture

### Core Structure
- **Web App**: React + TypeScript + Vite + Tailwind CSS
- **Mobile App**: React Native + Expo (in `mobile-app/` directory)
- **Backend**: Supabase Edge Functions (in `supabase/functions/`)
- **Database**: Supabase PostgreSQL
- **AI Integration**: Gemini API for business insights and data generation

### Key Components
- **Authentication**: Context-based auth system (currently needs API migration)
- **API Layer**: Centralized API service for all backend communication
- **Business Logic**: Inventory, Sales, Locations, Alerts, Reports, Analytics
- **AI Services**: Product generation, insights, report parsing

## Development Commands

### Web Application
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Mobile Application
```bash
# Navigate to mobile app directory
cd mobile-app

# Install dependencies
npm install

# Start Expo development server
npm run start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

### Supabase Functions
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy [function-name]

# Serve functions locally
supabase functions serve
```

## API Architecture

### Current Status (90% API-Ready)
All major business operations have been converted to API endpoints:
- Products: `/products` (CRUD operations)
- Sales: `/sales` (CRUD operations)
- Locations: `/locations` (CRUD operations)
- Alerts: `/alerts` (CRUD + resolution)
- Reports: `/ai-reports` (AI processing)
- Analytics: `/analytics` (aggregated data)
- User Settings: `/user-settings`
- Inventory Adjustments: `/inventory-adjustments`
- Sales Returns: `/sales-returns`

### Critical Missing Component
**Authentication API**: The authentication system still uses direct Supabase calls and needs API endpoint conversion for full mobile compatibility.

## Code Organization

### Frontend Structure
- `src/components/`: React components organized by feature
- `src/hooks/`: Custom hooks for data fetching and state management
- `src/contexts/`: React contexts for global state
- `src/services/`: API service layer and external integrations
- `src/utils/`: Utility functions and helpers
- `src/types/`: TypeScript type definitions

### Backend Structure
- `supabase/functions/`: Edge Functions for API endpoints
- `supabase/migrations/`: Database schema migrations

## Key Services

### API Service (`src/services/apiService.ts`)
Centralized service for all API calls with:
- Authentication header management
- Standardized error handling
- Type-safe endpoints for all business operations

### AI Service (`src/services/aiService.ts`)
Handles AI integrations:
- Product generation
- Business insights
- Report parsing
- Location and alert generation

## Development Guidelines

### Testing
- Check README or codebase for specific test commands
- No assumptions about test frameworks

### Type Safety
- Strict TypeScript configuration
- Comprehensive type definitions in `src/types/`
- Interface definitions for all API responses

### State Management
- React Context for global state
- Custom hooks for data fetching
- API-first approach for all data operations

## Known Issues

1. **Authentication Migration**: AuthContext needs conversion from direct Supabase calls to API endpoints
2. **Real-time Updates**: Some components would benefit from WebSocket/SSE integration
3. **Mobile Sync**: Authentication blocking full mobile app development

## Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_GEMINI_API_KEY`: Gemini API key for AI features

## Mobile App Considerations

The mobile app shares the same API endpoints as the web app but requires:
- Authentication API endpoints (currently missing)
- Async storage for offline capabilities
- Native chart libraries for analytics
- Push notifications for alerts