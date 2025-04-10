# Product Requirements Document (PRD)

## Image Selection Admin App

### Overview
A mobile-friendly web application that allows administrators to select suitable images for cards. The application will integrate with an existing Supabase project and will be hosted on GitHub Pages for free deployment.

### Problem Statement
Administrators need a simple way to review and select the most suitable image from multiple options for each card in the system. Currently, each card has 4 potential images, and administrators need an efficient way to choose the best one.

### User Personas
- **Admin Users**: Team members who need to review and select images for cards

### Requirements

#### Functional Requirements

1. **Authentication**
   - Login through Supabase authentication
   - Only authorized users can access the application

2. **Image Selection**
   - Display cards that have status "choosebaseimage"
   - For each card, display all 4 images from the asset_url JSON field
   - Allow users to select one image out of the 4 options
   - Update the card status after selection
   - Store the selected image information in Supabase

3. **User Interface**
   - Mobile-friendly design (responsive)
   - Simple, intuitive interface for quick image selection
   - Tinder-like swiping interface for easy selection on mobile devices

4. **Data Management**
   - Connect to Supabase database
   - Read card data with "choosebaseimage" status
   - Update card status after image selection
   - Remove unselected images from Cloudfront (optional feature)

#### Non-Functional Requirements

1. **Performance**
   - Fast loading of images
   - Responsive UI even with multiple images

2. **Security**
   - Secure authentication through Supabase
   - Proper authorization for admin actions

3. **Compatibility**
   - Works on all modern browsers
   - Optimized for mobile devices

4. **Cost**
   - Zero hosting cost (GitHub Pages)
   - Utilize existing Supabase project

### Architecture

#### System Components

1. **Frontend**
   - Single Page Application (SPA)
   - Hosted on GitHub Pages
   - Communicates with Supabase for data and authentication

2. **Backend**
   - Supabase (existing project)
   - Provides authentication, database, and API functionality

3. **Storage**
   - Images stored in Cloudfront (existing)

#### Data Flow

1. User authenticates through Supabase
2. Application fetches cards with "choosebaseimage" status
3. User selects preferred image for each card
4. Application updates card status and selected image information in Supabase
5. (Optional) Application triggers removal of unselected images from Cloudfront

### Tech Stack

1. **Frontend**
   - React.js (for building the UI)
   - Vite (for fast development and building)
   - TailwindCSS (for responsive styling)
   - React Router (for navigation)

2. **Backend/Database**
   - Supabase (existing project)
   - Supabase Auth (for authentication)
   - Supabase Database (PostgreSQL)

3. **Deployment**
   - GitHub Pages (for hosting)
   - GitHub Actions (for CI/CD)

### User Flow

1. User navigates to the application URL
2. User logs in using Supabase authentication
3. User is presented with cards that need image selection
4. For each card:
   - User views all 4 images
   - User selects the preferred image
   - System updates the card status
5. User continues until all cards are processed or logs out

### Timeline

Given the 2-hour constraint, the development will focus on the core functionality:

1. **Setup (30 minutes)**
   - Project initialization
   - Supabase integration

2. **Authentication (30 minutes)**
   - Implement login functionality

3. **Core Functionality (45 minutes)**
   - Fetch and display cards
   - Implement image selection
   - Update card status

4. **UI Refinement (15 minutes)**
   - Ensure mobile responsiveness
   - Basic styling

### Future Enhancements (Post 2-hour deadline)

1. Batch processing of multiple cards
2. Image comparison tools
3. Admin dashboard with statistics
4. Automated removal of unselected images
5. User role management

### Success Metrics

1. All team members can successfully log in and use the application
2. Images are correctly selected and updated in the database
3. Application works smoothly on mobile devices
4. Zero hosting cost maintained