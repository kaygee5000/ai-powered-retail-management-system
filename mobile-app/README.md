# RetailAI Manager Mobile App

This is the mobile application for RetailAI Manager, built with Expo and React Native.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your Supabase project details:
   - `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Running the App

1. Start the Expo development server:
   ```bash
   npm start
   ```

2. Use the Expo Go app on your phone to scan the QR code, or run on an emulator:
   - For iOS: `npm run ios`
   - For Android: `npm run android`

## Project Structure

- `app/` - Contains all the screens and layouts using Expo Router
- `components/` - Reusable UI components
- `providers/` - React context providers (authentication, etc.)
- `services/` - API services and external integrations
- `lib/` - Configuration and utility files
- `constants/` - App constants like colors, styles, etc.

## Features

- Authentication (login/signup)
- Dashboard overview
- Location management
- Inventory tracking
- Sales monitoring
- AI-powered reports

## API Integration

The app uses the same Supabase Edge Functions as the web application, ensuring data consistency across platforms.