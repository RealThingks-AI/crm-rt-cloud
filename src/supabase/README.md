# Supabase Integration

This folder contains all Supabase-related integration code.

## Structure

- `client.ts` - Supabase client initialization
- `auth.tsx` - Authentication context and hooks
- `types.ts` - TypeScript types for database schema
- `queries/` - Database query helpers
- `policies/` - RLS policy documentation

## Usage

```typescript
// Import client
import { supabase } from '@/supabase/client';

// Import auth
import { useAuth } from '@/supabase/auth';

// Import types
import type { Database } from '@/supabase/types';
```

## Authentication

The auth module provides:
- `useAuth()` hook for accessing current user
- `AuthProvider` component for wrapping the app
- Session management and persistence

## Database Types

All database types are automatically generated from the Supabase schema.