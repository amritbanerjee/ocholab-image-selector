# Architecture v2: Dashboard as Home Page

This document outlines the revised architecture where the existing Dashboard page becomes the primary landing page after user authentication.

## Goal

- Make the feature-rich dashboard (`src/components/pages/DashboardPage.jsx`) the default view after login, replacing the simpler `src/components/pages/Home.jsx`.
- Reorganize components for better clarity and maintainability.

## Navigation Concept

The application utilizes a two-tiered navigation system:

1.  **Top Navigation Bar:** Contains tabs representing the main functional sections of the application (e.g., 'Content Dashboard', 'Sales Dashboard'). Selecting a tab switches the entire context to that section.
2.  **Sidebar (within Sections):** Once a main section is selected via the top navigation, a sidebar (if applicable for that section) provides navigation between the different pages or views *within* that section.

## Proposed Folder Structure
```plaintext
src/
├── App.jsx           # Main application component, routing setup
├── main.jsx          # Entry point of the application
├── index.css         # Global styles
├── lib/              # Utility functions, Supabase client
│   ├── supabaseClient.js
│   └── utils.js
├── components/       # Shared UI components
│   ├── ui/             # Components from shadcn/ui (or similar)
│   └── layout/         # Layout components (e.g., MainLayout.jsx)
├── features/           # Feature-specific modules
│   ├── auth/             # Authentication related features
│   │   └── pages/
│   │       └── LoginPage.jsx     # Handles user authentication.
│   ├── content_dashboard/ # Content Dashboard features (formerly dashboard)
│   │   ├── components/     # Reusable components specific to the content dashboard
│   │   │   ├── StatCard.jsx
│   │   │   └── SimplePieChart.jsx
│   │   └── pages/
│   │       └── HomePage.jsx      # Main content dashboard view.
│   │       └── DeckListPage.jsx  # Page for listing available decks for review.
│   │       └── ImageSelectorPage.jsx # Page for selecting images for a specific deck.
│   └── ...               # Other features (e.g., card_creation, settings)
└── assets/             # Static assets (images, fonts, etc.)
```

**Key Changes:**

1.  **Restructure Pages:** Move page components (`HomePage.jsx`, `LoginPage.jsx`, `DeckListPage.jsx`, `ImageSelectorPage.jsx`) from `src/pages/` into feature-specific `pages` subdirectories within `src/features/` (e.g., `src/features/content_dashboard/pages/HomePage.jsx`). So Decklistpage, ImageSelectorPage, and HomePage are now within the content_dashboard feature.
2.  **Relocate Components:** Move shared layout components (`Sidebar.jsx`, `Header.jsx`, `NavigationTabs.jsx`) to `src/components/layout/`. Move content dashboard-specific components (`StatCard.jsx`, `SimplePieChart.jsx`) to `src/features/content_dashboard/components/`.
3.  **Update Imports:** Adjust import paths in `src/App.jsx`, `src/components/layout/MainLayout.jsx` (if applicable), and any other files referencing the moved components.
4.  **(Done)** Rename `DeckList.jsx` to `DeckListPage.jsx` (assuming this was done previously).
5.  **(Done)** Place `ImageSelectorPage.jsx` within the `image_selection` feature.

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

1.  Implement the folder restructuring as outlined above (create feature directories and move pages).
2.  Update import paths in `src/App.jsx` and other relevant files.
3.  Ensure routing in `src/App.jsx` correctly points to the new page locations.
4.  Test the application flow thoroughly.