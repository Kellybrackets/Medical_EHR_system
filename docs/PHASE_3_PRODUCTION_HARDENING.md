# Phase 3: Production Hardening - Week 3

## Production Readiness Action Plan

**Duration:** 5-7 days  
**Priority:** CRITICAL - Final security and performance optimizations before production  
**Estimated Time:** 40-50 hours

---

## Overview

This phase focuses on security auditing, performance optimization, monitoring setup, and final production configurations. These are the last steps before the application is ready for production deployment.

---

## Step 1: Security Audit & Hardening (Day 1-2, 10-12 hours)

### Objective

Conduct comprehensive security review and implement security best practices.

### Why This Matters

- Healthcare data requires highest security standards
- Prevents data breaches
- Ensures compliance (HIPAA, GDPR considerations)
- Protects user privacy

### Detailed Steps

#### Step 1.1: Review Row Level Security (RLS) Policies

**Action:** Audit all RLS policies in database migrations.

**Files to Review:**

- `supabase/migrations/20250101000001_normalized_schema.sql`
- `supabase/migrations/20250101000009_add_admin_and_practices.sql`
- `supabase/migrations/20250101000012_add_practice_isolation.sql`

**Checklist:**

- [ ] All tables have RLS enabled
- [ ] Policies are restrictive (principle of least privilege)
- [ ] Practice isolation enforced correctly
- [ ] Admin policies use security definer functions (no circular dependencies)
- [ ] No overly permissive policies (e.g., `USING (true)`)

**Create Security Audit Document:**
Create `SECURITY_AUDIT.md`:

```markdown
# Security Audit Report

## RLS Policy Review

### Patients Table

- ✅ RLS enabled
- ✅ Practice isolation enforced
- ⚠️ Review: Some policies allow all authenticated users

### Users Table

- ✅ RLS enabled
- ✅ Admin policies use security definer functions
- ✅ Self-service policies for profile updates

### Consultation Notes

- ✅ RLS enabled
- ✅ Doctor-only access enforced
- ✅ Practice isolation verified

## Recommendations

1. Tighten patient SELECT policies to practice-scoped only
2. Add audit logging for sensitive operations
3. Implement rate limiting
```

#### Step 1.2: Implement Rate Limiting

**Install Rate Limiting Library:**

```bash
npm install p-limit
```

**Create Rate Limiter Utility:**
Create `src/utils/rateLimiter.ts`:

```typescript
import pLimit from 'p-limit';

// Limit concurrent requests
const apiLimiter = pLimit(10);

// Limit requests per time window
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  checkLimit(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside window
    const validRequests = requests.filter((timestamp) => now - timestamp < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false; // Rate limit exceeded
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true; // Within limit
  }

  reset(key: string) {
    this.requests.delete(key);
  }
}

export const rateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
export { apiLimiter };
```

**Apply Rate Limiting to API Calls:**
Update `src/hooks/usePatients.ts`:

```typescript
import { apiLimiter, rateLimiter } from '../utils/rateLimiter';

const createPatient = useCallback(
  async (formData: PatientFormData): Promise<ApiResponse> => {
    // Check rate limit
    const userId = user?.id || 'anonymous';
    if (!rateLimiter.checkLimit(userId)) {
      return {
        success: false,
        error: 'Too many requests. Please wait a moment and try again.',
      };
    }

    return apiLimiter(async () => {
      // Existing createPatient logic
    });
  },
  [user],
);
```

#### Step 1.3: Add Input Sanitization

**Review Current Sanitization:**
Check all user inputs are sanitized:

- ✅ Using `.trim()` on strings
- ✅ Validating formats (email, phone, etc.)
- ✅ Type checking (numbers, dates)

**Add HTML Sanitization:**
For any rich text fields (consultation notes):

```bash
npm install dompurify
npm install -D @types/dompurify
```

Create `src/utils/sanitize.ts`:

```typescript
import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}
```

#### Step 1.4: Implement Content Security Policy

**Create CSP Configuration:**
Create `public/_headers` (for Netlify) or configure in hosting platform:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.sentry.io;
```

**Add Meta Tags:**
Update `index.html`:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
/>
<meta http-equiv="X-Content-Type-Options" content="nosniff" />
<meta http-equiv="X-Frame-Options" content="DENY" />
```

#### Step 1.5: Add Audit Logging

**Create Audit Log Table Migration:**
Create `supabase/migrations/20250101000014_add_audit_logging.sql`:

```sql
-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- RLS for audit logs (only admins can view)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Create Audit Logging Utility:**
Create `src/utils/audit.ts`:

```typescript
import { supabase } from '../lib/supabase';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'EXPORT';

export type ResourceType = 'PATIENT' | 'CONSULTATION' | 'USER' | 'PRACTICE' | 'SETTINGS';

export async function logAuditEvent(
  action: AuditAction,
  resourceType: ResourceType,
  resourceId?: string,
  details?: Record<string, any>,
) {
  try {
    await supabase.rpc('log_audit_event', {
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId || null,
      p_details: details || null,
    });
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('Failed to log audit event:', error);
  }
}
```

**Add Audit Logging to Critical Operations:**
Update `src/hooks/usePatients.ts`:

```typescript
import { logAuditEvent } from '../utils/audit';

const createPatient = useCallback(async (formData: PatientFormData): Promise<ApiResponse> => {
  // ... existing code ...

  if (result.success) {
    await logAuditEvent('CREATE', 'PATIENT', patientId, {
      firstName: formData.firstName,
      surname: formData.surname,
    });
  }

  return result;
}, []);
```

#### Step 1.6: Review Environment Variables Security

**Checklist:**

- [ ] No secrets in code
- [ ] All secrets in environment variables
- [ ] `.env` in `.gitignore`
- [ ] `.env.example` doesn't contain real values
- [ ] Production secrets stored securely (e.g., GitHub Secrets, Vercel/Netlify env vars)

#### Step 1.7: Implement Session Security

**Review Session Configuration:**

- [ ] Session timeout configured
- [ ] Secure cookie flags (if using cookies)
- [ ] Token refresh implemented
- [ ] Logout clears all sessions

**Update Session Management:**
Ensure proper session cleanup in `src/hooks/useAuth.ts`:

```typescript
const signOut = useCallback(async () => {
  try {
    // Clear local storage
    localStorage.clear();
    sessionStorage.clear();

    // Sign out from Supabase
    await supabase.auth.signOut();

    // Log audit event
    await logAuditEvent('LOGOUT', 'USER');
  } catch (error) {
    logger.error('Sign out error:', error);
  }
}, []);
```

### Success Criteria

- ✅ RLS policies audited and tightened
- ✅ Rate limiting implemented
- ✅ Input sanitization enhanced
- ✅ CSP headers configured
- ✅ Audit logging implemented
- ✅ Session security reviewed
- ✅ Security audit document created

### Files Created/Modified

- `SECURITY_AUDIT.md` (new)
- `src/utils/rateLimiter.ts` (new)
- `src/utils/sanitize.ts` (new)
- `src/utils/audit.ts` (new)
- `public/_headers` (new)
- `index.html` (updated)
- `supabase/migrations/20250101000014_add_audit_logging.sql` (new)
- `src/hooks/usePatients.ts` (updated)
- `src/hooks/useAuth.ts` (updated)

---

## Step 2: Performance Optimization (Day 2-3, 8-10 hours)

### Objective

Optimize application performance for production use.

### Detailed Steps

#### Step 2.1: Implement Code Splitting

**Update App.tsx with Lazy Loading:**

```typescript
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Lazy load dashboards
const DoctorDashboard = lazy(() => import('./components/dashboards/DoctorDashboard'));
const ReceptionistDashboard = lazy(() => import('./components/dashboards/ReceptionistDashboard'));
const AdminDashboard = lazy(() => import('./components/dashboards/AdminDashboard'));
const PatientForm = lazy(() => import('./components/patient/PatientForm'));
const PatientView = lazy(() => import('./components/patient/PatientView'));
const ConsultationForm = lazy(() => import('./components/consultation/ConsultationForm'));

// Wrap lazy components with Suspense
function AppContent() {
  // ... existing code ...

  if (user?.role === 'doctor') {
    return (
      <Suspense fallback={<LoadingSpinner size="lg" text="Loading dashboard..." />}>
        <DoctorDashboard {...props} />
      </Suspense>
    );
  }

  // Repeat for other roles
}
```

#### Step 2.2: Optimize Bundle Size

**Analyze Bundle:**

```bash
npm run build
npx vite-bundle-visualizer
```

**Optimize Imports:**

- Use named imports instead of default imports where possible
- Import only needed functions from libraries
- Remove unused dependencies

**Example:**

```typescript
// Before
import * as Icons from 'lucide-react';

// After
import { User, Settings } from 'lucide-react';
```

#### Step 2.3: Optimize Images

**If using images:**

- Use WebP format
- Implement lazy loading
- Use appropriate sizes
- Consider CDN

#### Step 2.4: Optimize Database Queries

**Review Query Patterns:**

- Use database functions for complex queries
- Add indexes where needed
- Avoid N+1 queries
- Use pagination for large datasets

**Add Pagination:**
Update `src/hooks/usePatients.ts`:

```typescript
const [page, setPage] = useState(1);
const pageSize = 50;

const loadPatients = useCallback(async () => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('created_at', { ascending: false });

  // ... rest of logic
}, [page]);
```

#### Step 2.5: Implement Caching

**Add React Query (Optional but Recommended):**

```bash
npm install @tanstack/react-query
```

**Set Up Query Client:**
Create `src/lib/queryClient.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

#### Step 2.6: Optimize Re-renders

**Use React.memo:**
Wrap expensive components:

```typescript
export const PatientCard = React.memo(({ patient }: Props) => {
  // Component code
});
```

**Use useMemo and useCallback:**
Already implemented in many places, but review for optimization opportunities.

#### Step 2.7: Add Performance Monitoring

**Integrate Web Vitals:**

```bash
npm install web-vitals
```

Create `src/utils/performance.ts`:

```typescript
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  console.log(metric);
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

**Call in main.tsx:**

```typescript
import { reportWebVitals } from './utils/performance';

reportWebVitals();
```

### Success Criteria

- ✅ Code splitting implemented
- ✅ Bundle size optimized
- ✅ Database queries optimized
- ✅ Caching implemented
- ✅ Performance monitoring added
- ✅ Lighthouse score >90

### Files Created/Modified

- `src/App.tsx` (updated)
- `src/lib/queryClient.ts` (new)
- `src/utils/performance.ts` (new)
- `src/main.tsx` (updated)
- `src/hooks/usePatients.ts` (updated)

---

## Step 3: Monitoring & Observability (Day 3-4, 8-10 hours)

### Objective

Set up comprehensive monitoring for production.

### Detailed Steps

#### Step 3.1: Enhance Sentry Configuration

**Update Sentry Setup:**
Update `src/lib/sentry.ts`:

```typescript
import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not configured.');
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.feedbackIntegration({
        colorScheme: 'light',
      }),
    ],
    tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
    replaysSessionSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
    beforeSend(event, hint) {
      // Filter sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.['Authorization'];
      }

      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error && error.message.includes('ResizeObserver')) {
          return null; // Ignore ResizeObserver errors
        }
      }

      return event;
    },
  });
}
```

#### Step 3.2: Add Performance Monitoring

**Already added in Step 2.7, but enhance:**

Add custom performance tracking:

```typescript
export function trackPerformance(name: string, duration: number) {
  if (import.meta.env.PROD) {
    Sentry.metrics.distribution(name, duration, {
      unit: 'millisecond',
    });
  }
}

// Usage example:
const start = performance.now();
await loadPatients();
const duration = performance.now() - start;
trackPerformance('patients.load', duration);
```

#### Step 3.3: Set Up Uptime Monitoring

**Options:**

- UptimeRobot (free tier available)
- Pingdom
- StatusCake

**Configure:**

1. Create account
2. Add monitoring endpoint: `https://your-domain.com/health`
3. Set alert thresholds
4. Configure notifications

#### Step 3.4: Create Health Check Endpoint

**For Vercel/Netlify:**
Create `api/health.ts` (or `api/health.js`):

```typescript
export default async function handler(req: any, res: any) {
  try {
    // Check database connection
    const { error } = await supabase.from('users').select('count').limit(1);

    if (error) {
      return res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

**For Static Hosting:**
Create `public/health.json` (updated via CI/CD or cron):

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

#### Step 3.5: Set Up Log Aggregation

**Options:**

- LogRocket (for frontend)
- Datadog
- CloudWatch (if using AWS)

**Configure LogRocket:**

```bash
npm install logrocket
```

Create `src/lib/logrocket.ts`:

```typescript
import LogRocket from 'logrocket';

export function initLogRocket() {
  const appId = import.meta.env.VITE_LOGROCKET_APP_ID;

  if (!appId || import.meta.env.DEV) {
    return;
  }

  LogRocket.init(appId, {
    dom: {
      textSanitizer: true,
      inputSanitizer: true,
    },
  });
}
```

#### Step 3.6: Create Monitoring Dashboard

**Create Monitoring Document:**
Create `MONITORING.md`:

```markdown
# Monitoring Dashboard

## Key Metrics to Track

### Application Health

- Uptime: [Link to uptime monitor]
- Error Rate: [Sentry Dashboard]
- Response Time: [Sentry Performance]

### Database

- Connection Pool Usage
- Query Performance
- Replication Lag

### User Metrics

- Active Users
- Session Duration
- Feature Usage

## Alert Thresholds

- Error Rate > 1%: Critical
- Response Time > 2s: Warning
- Uptime < 99.9%: Critical
```

### Success Criteria

- ✅ Sentry fully configured
- ✅ Performance monitoring active
- ✅ Uptime monitoring set up
- ✅ Health check endpoint created
- ✅ Log aggregation configured
- ✅ Monitoring dashboard documented

### Files Created/Modified

- `src/lib/sentry.ts` (updated)
- `src/lib/logrocket.ts` (new)
- `api/health.ts` (new)
- `MONITORING.md` (new)

---

## Step 4: Production Configuration (Day 4-5, 6-8 hours)

### Objective

Configure application for production deployment.

### Detailed Steps

#### Step 4.1: Environment-Specific Configurations

**Create Config Utility:**
Create `src/config/index.ts`:

```typescript
const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'EHR System',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.MODE,
  },
  api: {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableErrorTracking: import.meta.env.VITE_SENTRY_DSN !== undefined,
  },
};

export default config;
```

#### Step 4.2: Build Optimization

**Update vite.config.ts:**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react'],
        },
      },
    },
    sourcemap: import.meta.env.PROD ? 'hidden' : true,
    chunkSizeWarningLimit: 1000,
  },
});
```

#### Step 4.3: Create Production Build Script

**Update package.json:**

```json
{
  "scripts": {
    "build:prod": "NODE_ENV=production vite build",
    "build:analyze": "vite build --mode production && npx vite-bundle-visualizer"
  }
}
```

#### Step 4.4: Set Up Deployment Pipeline

**Create Deployment Script:**
Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "Building application..."
npm run build:prod

echo "Running tests..."
npm test

echo "Deployment complete!"
```

**Make executable:**

```bash
chmod +x scripts/deploy.sh
```

#### Step 4.5: Create Deployment Documentation

**Create DEPLOYMENT.md:**

```markdown
# Deployment Guide

## Prerequisites

- Node.js 20+
- npm 8+
- Supabase project configured

## Environment Variables

See .env.example

## Build

npm run build:prod

## Deploy

[Platform-specific instructions]
```

#### Step 4.6: Configure CDN (if applicable)

**For Vercel/Netlify:**

- Automatic CDN configuration
- Edge caching
- Image optimization

**Manual CDN Setup:**

- Configure cache headers
- Set up CDN distribution
- Configure SSL certificates

### Success Criteria

- ✅ Environment configs set up
- ✅ Production build optimized
- ✅ Deployment pipeline configured
- ✅ Documentation complete
- ✅ CDN configured (if applicable)

### Files Created/Modified

- `src/config/index.ts` (new)
- `vite.config.ts` (updated)
- `scripts/deploy.sh` (new)
- `DEPLOYMENT.md` (new)

---

## Step 5: Documentation & Runbooks (Day 5-6, 6-8 hours)

### Objective

Create comprehensive documentation for operations and maintenance.

### Detailed Steps

#### Step 5.1: Create Main README

**Create README.md:**

```markdown
# EHR System

Electronic Health Records management system built with React, TypeScript, and Supabase.

## Features

- Patient management
- Consultation notes
- Multi-practice support
- Real-time updates
- Role-based access control

## Getting Started

[Setup instructions]

## Development

[Development guide]

## Deployment

[Deployment guide]

## Contributing

[Contributing guidelines]
```

#### Step 5.2: Create API Documentation

**Document API endpoints, hooks, and utilities.**

#### Step 5.3: Create Runbooks

**Create RUNBOOKS.md:**

```markdown
# Operational Runbooks

## Common Issues

### Database Connection Issues

1. Check Supabase dashboard
2. Verify environment variables
3. Check network connectivity

### High Error Rate

1. Check Sentry dashboard
2. Review recent deployments
3. Check database performance

### Performance Issues

1. Check bundle size
2. Review database queries
3. Check CDN cache hit rate
```

#### Step 5.4: Create Architecture Documentation

**Create ARCHITECTURE.md:**

```markdown
# System Architecture

## Overview

[High-level architecture]

## Components

[Component breakdown]

## Data Flow

[Data flow diagrams]

## Security

[Security architecture]
```

### Success Criteria

- ✅ README.md complete
- ✅ API documentation complete
- ✅ Runbooks created
- ✅ Architecture documented

### Files Created

- `README.md` (new/updated)
- `API.md` (new)
- `RUNBOOKS.md` (new)
- `ARCHITECTURE.md` (new)

---

## Step 6: Final Security Review (Day 6-7, 4-6 hours)

### Objective

Final security checklist and penetration testing preparation.

### Detailed Steps

#### Step 6.1: Security Checklist

**Review:**

- [ ] All RLS policies tested
- [ ] Input validation comprehensive
- [ ] Rate limiting active
- [ ] Audit logging working
- [ ] Secrets not in code
- [ ] HTTPS enforced
- [ ] CSP headers set
- [ ] Session security verified

#### Step 6.2: Prepare for Penetration Testing

**Create Security Testing Document:**

```markdown
# Security Testing Plan

## Test Areas

1. Authentication & Authorization
2. Input Validation
3. SQL Injection
4. XSS Prevention
5. CSRF Protection
6. Session Management
```

#### Step 6.3: Compliance Review

**If handling healthcare data:**

- Review HIPAA requirements (if US)
- Review GDPR requirements (if EU)
- Document compliance measures

### Success Criteria

- ✅ Security checklist complete
- ✅ Penetration testing plan ready
- ✅ Compliance reviewed

---

## Step 7: Load Testing (Day 7, 4-6 hours)

### Objective

Test application under load.

### Detailed Steps

#### Step 7.1: Set Up Load Testing

**Use k6 or Artillery:**

```bash
npm install -D @k6/io
```

**Create Load Test:**
Create `tests/load/patient-creation.js`:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
};

export default function () {
  const res = http.post('https://your-api.com/patients', {
    // Test data
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

#### Step 7.2: Run Load Tests

**Test scenarios:**

- Patient creation
- Patient list loading
- Consultation creation
- Concurrent users

#### Step 7.3: Analyze Results

**Review:**

- Response times
- Error rates
- Database performance
- Identify bottlenecks

### Success Criteria

- ✅ Load tests created
- ✅ Tests run successfully
- ✅ Performance acceptable
- ✅ Bottlenecks identified and addressed

---

## Phase 3 Completion Checklist

- [ ] Step 1: Security audit complete
- [ ] Step 2: Performance optimized
- [ ] Step 3: Monitoring set up
- [ ] Step 4: Production config complete
- [ ] Step 5: Documentation complete
- [ ] Step 6: Security review done
- [ ] Step 7: Load testing complete

**Total Estimated Time:** 40-50 hours  
**Recommended Schedule:** 5-7 days

---

## Final Production Readiness Checklist

Before deploying to production:

- [ ] All Phase 1 tasks complete
- [ ] All Phase 2 tasks complete
- [ ] All Phase 3 tasks complete
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Monitoring active
- [ ] Documentation complete
- [ ] Team trained on operations
- [ ] Backup and recovery plan in place
- [ ] Incident response plan ready

---

## Troubleshooting

### Issue: Security audit finds vulnerabilities

**Solution:** Address each finding. Don't deploy until critical issues resolved.

### Issue: Performance not meeting targets

**Solution:** Profile application. Identify bottlenecks. Optimize queries and code.

### Issue: Monitoring not working

**Solution:** Verify API keys. Check network connectivity. Review configuration.

---

**Phase 3 Complete! Application Ready for Production!** 🎉🚀
