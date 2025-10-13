# Certificate Verification System - Frontend

A modern React-based frontend application for the Certificate Verification Mock Demo system.

## Technology Stack

- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **React Hot Toast** - Toast notifications
- **Heroicons** - Icon library
- **date-fns** - Date formatting

## Prerequisites

- Node.js 20+ LTS
- npm or yarn
- Backend API running on `http://localhost:3001`

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:
   ```env
   VITE_API_BASE_URL=http://localhost:3001/api/v1
   VITE_APP_NAME=Certificate Verification System
   VITE_APP_VERSION=1.0.0
   ```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Building for Production

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── common/       # Reusable UI components
│   │   └── layout/       # Layout components
│   ├── pages/            # Page components
│   ├── services/         # API service layer
│   ├── stores/           # Zustand state stores
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── routes/           # Route configuration
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

## Features

### Authentication
- User login and registration
- JWT token-based authentication
- Protected routes with role-based access control
- Automatic token refresh

### Dashboard
- Overview statistics
- Certificate and verification metrics
- Quick action buttons
- Recent activity feed

### Certificate Management
- Upload certificates (JSON format)
- View all certificates
- Filter and search certificates
- Certificate details view
- Delete certificates

### Verification Tracking
- List all verifications
- View verification details
- See verification steps and timeline
- View evidence and confidence scores
- Retry failed verifications

### Manual Review (Verifier Role)
- Review queue with pending certificates
- Assign reviews to verifiers
- Submit review decisions
- View review history
- Priority-based queue management

### Admin Features (Admin Role)
- User management (create, edit, delete)
- System statistics
- Activity monitoring
- Role assignment

### User Profile
- View and edit profile
- Change password
- View account information

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier

## API Integration

The frontend communicates with the backend API at `http://localhost:3001/api/v1`.

### Authentication
All API requests (except login/register) require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Error Handling
- 401 Unauthorized - Redirects to login
- 403 Forbidden - Shows permission error
- 429 Too Many Requests - Shows rate limit error
- 500+ Server Error - Shows server error message

## User Roles

1. **API_USER** - Regular user
   - Upload certificates
   - View own certificates
   - Track verifications

2. **VERIFIER** - Manual reviewer
   - All API_USER permissions
   - Access review queue
   - Submit review decisions

3. **ADMIN** - Administrator
   - All VERIFIER permissions
   - User management
   - System statistics
   - Full system access

## Default Test Users

After seeding the database, you can use these test accounts:

```
Admin:
Email: admin@example.com
Password: Admin123!

Verifier:
Email: verifier@example.com
Password: Verifier123!

API User:
Email: user@example.com
Password: User123!
```

## UI Components

### Common Components
- **Button** - Styled button with variants (primary, secondary, success, danger, ghost)
- **Input** - Form input with label, error, and helper text
- **Card** - Container with optional title and actions
- **Badge** - Status badge with color variants
- **LoadingSpinner** - Loading indicator

### Layout Components
- **Layout** - Main layout with sidebar and header
- **Sidebar** - Navigation sidebar with role-based menu items
- **Header** - Top header with user info and logout

## Styling

The application uses Tailwind CSS with a custom color palette:

- **Primary** - Blue (#3B82F6)
- **Success** - Green (#10B981)
- **Warning** - Yellow (#F59E0B)
- **Danger** - Red (#EF4444)

## State Management

Zustand stores:
- **authStore** - Authentication state (user, token, login, logout)
- **uiStore** - UI state (sidebar, modals)

## Routing

Protected routes require authentication. Role-based routes check user permissions.

Example routes:
- `/login` - Public
- `/dashboard` - Protected
- `/verifier/queue` - Protected (VERIFIER, ADMIN)
- `/admin/users` - Protected (ADMIN)

## Development Tips

1. **Hot Module Replacement (HMR)** - Changes reflect instantly during development
2. **TypeScript** - Use types for better IDE support and fewer bugs
3. **Tailwind CSS** - Use utility classes for rapid UI development
4. **Component Reusability** - Create reusable components in `components/common`

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, modify `vite.config.ts`:
```typescript
server: {
  port: 3001, // Change to different port
}
```

### API Connection Issues
1. Ensure backend is running on `http://localhost:3001`
2. Check CORS configuration in backend
3. Verify `VITE_API_BASE_URL` in `.env`

### Build Errors
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Check TypeScript errors: `npm run build`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Support

For issues and questions, please refer to the main project README or create an issue in the repository.