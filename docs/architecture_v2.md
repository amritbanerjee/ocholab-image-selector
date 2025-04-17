# Architecture v2: Dashboard as Home Page

This document outlines the revised architecture where the existing Dashboard page becomes the primary landing page after user authentication.

## Goal

- Make the feature-rich dashboard (`src/components/pages/DashboardPage.jsx`) the default view after login, replacing the simpler `src/components/pages/Home.jsx`.
- Reorganize components for better clarity and maintainability.

## Proposed Folder Structure

We will restructure the `src` directory to better reflect the application's flow and component hierarchy.

```
src/
├── App.jsx             # Main application component with routing
├── main.jsx            # Application entry point
├── index.css           # Global styles
├── lib/                # Utility functions and Supabase client
│   ├── supabaseClient.js
│   └── utils.js
├── components/         # Reusable UI components (non-page specific)
│   ├── ProtectedRoute.jsx
│   ├── Login.jsx
│   ├── ImageSelection.jsx # (Consider moving to pages/deck/ if specific)
│   └── ui/               # Shadcn UI components
│       └── card.jsx
│       └── ...
├── pages/              # Page-level components (routed views)
│   ├── HomePage.jsx      # Renamed from DashboardPage.jsx
│   ├── DeckListPage.jsx  # Renamed from DeckList.jsx
│   ├── DeckImageViewerPage.jsx # New or refactored from ImageSelection for specific deck
│   └── LoginPage.jsx     # Potentially refactor Login.jsx into here
├── features/           # (Optional) Feature-specific components/logic
│   └── dashboard/        # Components specific to the dashboard/home page
│       ├── Sidebar.jsx
│       ├── Header.jsx
│       ├── NavigationTabs.jsx
│       ├── StatCard.jsx
│       └── SimplePieChart.jsx
│   └── deck_review/
│       └── ...
└── assets/             # Static assets (images, fonts, etc.)
```

**Key Changes:**

1.  **Rename `DashboardPage.jsx`:** Rename `src/components/pages/DashboardPage.jsx` to `src/pages/HomePage.jsx`.
2.  **Relocate Dashboard Components:** Move dashboard-specific sub-components (like `Sidebar`, `Header`, `StatCard`, `SimplePieChart`) into a dedicated feature folder, e.g., `src/features/dashboard/`.
3.  **Update Imports:** Adjust import paths in `HomePage.jsx` and potentially other files to reflect the new locations.
4.  **Rename `DeckList.jsx`:** Rename `src/components/pages/DeckList.jsx` to `src/pages/DeckListPage.jsx` for consistency.
5.  **Refactor `ImageSelection.jsx`:** Consider if `ImageSelection.jsx` should be a generic component or part of a specific page flow (e.g., `src/pages/DeckImageViewerPage.jsx`).

## Routing Changes (`src/App.jsx`)

The routing logic in `src/App.jsx` needs to be updated:

1.  **Import `HomePage`:** Change the import from `DashboardPage` to `HomePage`.
2.  **Update Home Route:** Modify the route currently pointing to `/home` (or create a new one for `/`) within the `ProtectedRoute` to render `<HomePage />` instead of `<Home />`.
3.  **Remove Old Home Route:** The route for the original `Home.jsx` component can likely be removed unless it serves another purpose.
4.  **Update Other Routes:** Ensure routes like `/deck/:deckId/images` point to the correct page component (e.g., `DeckImageViewerPage`).

**Example Snippet (Conceptual):**

```jsx
// src/App.jsx
import HomePage from './pages/HomePage'; // Updated import
// ... other imports

function App() {
  // ... session logic ...

  return (
    <Router basename="/ocholab-image-selector">
      {/* Conditional Navbar rendering might need adjustment based on HomePage layout */}
      <Routes>
        <Route path="/login" element={<LoginPage supabase={supabase} />} /> {/* Or keep Login component */}
        <Route
          path="/"
          element={
            <ProtectedRoute session={session} supabase={supabase}>
              <HomePage supabase={supabase} session={session} /> {/* Main route after login */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/decks"
          element={
            <ProtectedRoute session={session} supabase={supabase}>
              <DeckListPage supabase={supabase} session={session} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deck/:deckId/images"
          element={
            <ProtectedRoute session={session} supabase={supabase}>
              {/* Point to the appropriate image selection/viewer page */}
              <DeckImageViewerPage supabase={supabase} session={session} />
            </ProtectedRoute>
          }
        />
        {/* Remove or repurpose old /home route */}
        {/* Remove /dashboard route */}
        {/* Remove /image-selection route if replaced */}
        {/* Remove /cards-for-review route if replaced by /decks */}
      </Routes>
    </Router>
  );
}
```

## Next Steps

1.  Implement the folder restructuring.
2.  Rename files and update import paths.
3.  Modify `src/App.jsx` with the new routing logic.
4.  Test the application flow thoroughly.