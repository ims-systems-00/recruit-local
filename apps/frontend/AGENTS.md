# Recruit Local — Frontend Development Rules

## 1. Scope

These rules apply **only to the Recruit Local frontend**.

- Work only inside the frontend application.
- Do NOT modify backend code, backend APIs, database schemas, server logic, authentication server logic, or infrastructure unless explicitly requested.
- Before making any change, understand the existing frontend architecture and patterns.

---

## 2. Project Understanding First

Before implementing any feature or fixing any bug:

1. Inspect the relevant existing files.
2. Understand the current routing structure.
3. Understand the existing component structure.
4. Understand how API calls are currently handled.
5. Check existing types/interfaces/enums.
6. Check existing hooks, contexts, utilities, and shared components.
7. Search for similar functionality already implemented elsewhere.
8. Reuse existing patterns instead of introducing a new pattern.

Do not start coding based only on the task description.

---

## 3. Analyze Before Coding

For non-trivial tasks, first provide:

1. What needs to change
2. Current frontend flow
3. Affected files
4. Components/hooks/utilities involved
5. API dependencies
6. Possible edge cases
7. Proposed implementation approach

**Do not modify code until the implementation approach is approved**, unless the user explicitly asks to implement immediately.

---

## 4. Frontend-Only Rule

Never make backend changes.

Do not modify:

- Express/server code
- MongoDB/Mongoose code
- Database models
- Backend controllers
- Backend routes
- Backend middleware
- Redis logic
- Server infrastructure
- Nginx
- AWS/server configuration

If a frontend change requires a backend change, clearly report:

> "This frontend requirement depends on a backend change."

Then explain exactly what frontend dependency is missing.

---

## 5. Existing Architecture Has Priority

Follow the existing Recruit Local architecture.

Do not introduce a new architecture just because it seems cleaner.

Before creating something new, search for:

- Existing component
- Existing hook
- Existing utility
- Existing API function
- Existing type
- Existing enum
- Existing UI pattern
- Existing form pattern
- Existing pagination pattern
- Existing error handling
- Existing loading state

Reuse when possible.

---

## 6. Next.js Rules

The project uses Next.js App Router.

Respect the existing route structure and route groups.

Before changing routes:

- Inspect the existing route hierarchy.
- Check related layouts.
- Check middleware.
- Check authentication/authorization flow.
- Check redirects.
- Check loading/error/not-found handling.

Do not unnecessarily restructure routes.

Do not introduce Pages Router patterns.

---

## 7. React Rules

Use the existing React patterns in the project.

Prefer:

- Reusable components
- Small focused components
- Custom hooks when logic is reusable
- Existing context/state patterns
- Existing React Query patterns
- Existing form patterns

Avoid:

- Unnecessary global state
- Duplicate components
- Duplicate API logic
- Large monolithic components
- Unnecessary `useEffect`
- Unnecessary `useMemo`
- Unnecessary `useCallback`

Do not optimize code prematurely.

---

## 8. TypeScript Rules

The Recruit Local frontend uses TypeScript.

Always maintain strong typing.

Prefer existing project types/enums.

Do not:

- Use `any` unless absolutely unavoidable
- Duplicate existing types
- Create slightly different versions of the same API response type
- Ignore TypeScript errors
- Suppress errors with `@ts-ignore` without a strong reason

If an API response type already exists, reuse it.

If the API response type is inconsistent, identify the inconsistency before changing it.

---

## 9. API Integration Rules

Do not create a new API client pattern.

First inspect how the project currently handles:

- Axios
- API services
- React Query
- Query keys
- Mutations
- Authentication
- Error handling
- Refresh tokens
- Loading states

Follow the existing pattern.

Do not put API calls directly into UI components if the project already has a service/hook architecture.

---

## 10. Forms

Follow the existing form architecture.

Before creating a form, inspect existing examples using:

- React Hook Form
- Yup/Zod
- Existing form components
- Existing validation schemas
- Existing input components

Preserve existing behavior such as:

- `shouldUnregister`
- Default values
- Edit-mode hydration
- Validation
- Error messages
- Loading/submitting states

Do not replace the project's existing form solution with another library.

---

## 11. UI / Design System

Follow the existing design system.

Reuse:

- Existing components
- shadcn components
- Tailwind utilities
- Existing design tokens
- Existing typography
- Existing spacing
- Existing colors
- Existing responsive patterns

Do not introduce another UI library unless explicitly requested.

Do not create duplicate buttons, inputs, dialogs, dropdowns, cards, etc. when an existing component already exists.

---

## 12. Tailwind Rules

Use the project's existing Tailwind v4 approach.

Prefer existing design tokens and utility classes.

Do not:

- Add unnecessary CSS files
- Introduce another styling system
- Create arbitrary values when an existing token exists
- Duplicate styles across components

If a design token already exists, use it.

---

## 13. Responsive Design

Every frontend UI change must consider:

- Desktop
- Tablet
- Mobile

Do not assume desktop-only behavior unless explicitly requested.

Check:

- Layout overflow
- Long text
- Buttons
- Forms
- Tables
- Modals
- Sidebars
- Navigation
- Empty states

---

## 14. Authentication / Authorization

Do not change authentication architecture without explicit approval.

Before modifying authenticated pages:

1. Inspect middleware.
2. Inspect session handling.
3. Inspect user role/type logic.
4. Inspect protected layouts.
5. Inspect existing redirects.
6. Inspect how user/session data is consumed.

Preserve existing authentication behavior.

---

## 15. Recruiter / Candidate Flows

Recruit Local has different user flows.

Always determine whether the change affects:

- Candidate
- Recruiter/Employer
- Authenticated user
- Unauthenticated user

Do not assume a shared flow is identical between roles.

When modifying recruiter functionality, verify that candidate functionality is not accidentally affected.

---

## 16. Routing Rules

Before modifying any route:

- Search for references to the route.
- Check navigation links.
- Check redirects.
- Check middleware behavior.
- Check dynamic route parameters.
- Check layouts and route groups.

Do not rename or move routes casually.

After route changes, verify all related links and redirects.

---

## 17. State Management

Use the existing state-management strategy.

Before introducing state:

1. Check whether server state already comes from React Query.
2. Check whether local state is sufficient.
3. Check whether context already provides the required data.

Do not introduce Redux/Zustand/another state library unless explicitly requested.

---

## 18. Loading / Error / Empty States

Every async frontend feature should properly handle:

- Loading
- Success
- Error
- Empty
- Retry where appropriate

Do not leave blank screens while data is loading.

Do not silently ignore API errors.

Use the existing project's loading and error UI patterns.

---

## 19. Pagination / Infinite Scroll

If modifying lists, first inspect the existing pagination implementation.

Preserve:

- Cursor behavior
- Existing query parameters
- Existing filters
- Existing sorting
- Existing IDs
- Existing infinite-scroll behavior

Do not replace cursor pagination with page-based pagination unless explicitly requested.

---

## 20. Search / Filter Behavior

Before modifying search or filters:

- Find the existing filter implementation.
- Understand URL/query parameter behavior.
- Understand API parameter formatting.
- Check debounce behavior.
- Check reset behavior.
- Check pagination reset behavior.

Do not add another debounce package if the project already has a suitable pattern.

---

## 21. Performance

Prefer simple, maintainable code.

Optimize only when there is a real reason.

Avoid:

- Unnecessary rerenders
- Duplicate API requests
- Unnecessary effects
- Large client components
- Unnecessary client-side state
- Unnecessary dependencies

Do not convert server components to client components unless required.

---

## 22. Server vs Client Components

Use Server Components by default when possible.

Use `"use client"` only when the component requires client-side behavior such as:

- State
- Effects
- Browser APIs
- Event handlers
- Client-only libraries

Do not add `"use client"` unnecessarily.

---

## 23. File Structure

Follow the existing project structure.

Before creating a file, determine the correct location based on existing conventions.

Do not create random folders such as:

- `helpers2`
- `utils-new`
- `components-new`
- `services-v2`

unless the architecture explicitly requires them.

---

## 24. Code Quality

Code should be:

- Readable
- Maintainable
- Reusable
- Strongly typed
- Consistent with existing code
- Minimal in scope

Avoid over-engineering.

Do not refactor unrelated code while implementing a feature.

---

## 25. Minimal Change Principle

Change only what is necessary.

Do not:

- Rewrite working components unnecessarily
- Rename unrelated variables
- Reformat unrelated files
- Upgrade dependencies without approval
- Change architecture unnecessarily
- Fix unrelated issues in the same task

Keep the diff focused.

---

## 26. Dependency Rule

Do not install a new npm package unless:

1. The requirement genuinely needs it.
2. Existing project dependencies cannot solve it.
3. The package is justified.

Before installing anything, explain why it is necessary.

---

## 27. Existing Bugs

If you discover an unrelated bug while working:

Do not automatically fix it.

Report it separately:

> Found unrelated issue: `...`

Only fix it if the user asks or it directly blocks the requested task.

---

## 28. Before Implementation

For complex tasks, use this workflow:

### Step 1 — Understand

Inspect the relevant code.

### Step 2 — Trace

Trace the complete frontend flow.

Example:

`Page → Component → Hook → API → State → UI`

### Step 3 — Identify

List:

- Files to modify
- Files to create
- Files to delete, if any
- Existing components to reuse

### Step 4 — Edge Cases

Identify possible:

- Null values
- Undefined values
- Empty responses
- Loading states
- API errors
- Permission issues
- Mobile issues
- Duplicate requests
- Invalid route parameters

### Step 5 — Plan

Explain the exact implementation approach.

### Step 6 — Approval

Wait for user approval before modifying code unless the user explicitly requested immediate implementation.

---

## 29. After Implementation

After making changes:

1. Review the changed files.
2. Check TypeScript errors.
3. Check lint errors.
4. Check affected routes.
5. Check responsive behavior.
6. Check loading/error/empty states.
7. Check that existing functionality was not broken.
8. Remove unnecessary code.

Then provide a concise summary:

- What changed
- Files changed
- What was tested
- Any remaining issues

---

## 30. Important Rule

**Do not guess.**

If something is unclear:

- Inspect the code.
- Search the repository.
- Follow existing patterns.
- Ask the user only when the decision cannot be determined from the codebase.

Never invent:

- API endpoints
- API response structures
- Types
- Routes
- Authentication behavior
- Component behavior

The existing Recruit Local codebase is the source of truth.

---

## 31. Final Principle

> **Understand → Trace → Reuse → Plan → Approve → Implement → Verify**

Always prioritize:

**Existing architecture > consistency > minimal changes > maintainability > new abstractions.**
