# UA Designs PMS Frontend

A modern React-based Project Management System frontend built with TypeScript, Vite, and Ant Design.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/UA-Designs/UA-Designs-Frontend-.git
   cd UA-Designs-Frontend-
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔐 Login Credentials

### Admin Access
- **Email**: `admin@uadesigns.com`
- **Password**: `admin123`
- **Role**: System Administrator with full access

> **Note**: This application now connects to a real API. Contact your system administrator for additional user accounts and credentials.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Charts/         # Chart components (Gantt, Risk Matrix, etc.)
│   ├── Dashboard/      # Dashboard-specific components
│   ├── Layout/         # Layout components
│   └── Schedule/       # Schedule-related components
├── contexts/           # React contexts for state management
├── pages/              # Page components
│   ├── Analytics/      # Analytics dashboard
│   ├── Auth/           # Authentication pages
│   ├── Dashboard/      # Main dashboard
│   ├── PMBOK/          # PMBOK knowledge areas
│   ├── Profile/        # User profile
│   ├── Reports/        # Reports section
│   ├── Settings/       # Application settings
│   └── Users/          # User management
├── services/           # API service layer
├── stores/             # Zustand state stores
├── styles/             # Global styles and themes
└── types/              # TypeScript type definitions
```

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run start        # Alias for dev command
```

### Building
```bash
npm run build        # Build for production (optimized)
npm run build:check  # Build with TypeScript validation
npm run preview      # Preview production build locally
```

### Code Quality
```bash
npm run lint         # Check for linting errors
npm run lint:fix     # Fix auto-fixable linting errors
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # Run TypeScript type checking
npm run check-all    # Run all checks (type, lint, format)
```

## 🔧 Environment Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Application Settings
VITE_APP_NAME=UA Designs PMS
VITE_APP_VERSION=1.0.0

# Development Settings
VITE_DEBUG=true
```

### Environment Files Priority
1. `.env.local` (highest priority, ignored by git)
2. `.env.development.local`
3. `.env.development`
4. `.env` (lowest priority)

## 🎨 Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Ant Design
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Forms**: React Hook Form + Yup validation
- **HTTP Client**: Axios
- **Styling**: CSS + Ant Design themes
- **Code Quality**: ESLint + Prettier

## 🏷️ Brand Identity

### Logo & Design System
- **Logo**: Custom UA Designs logo with 3D block letters and neon green accents
- **Color Palette**: 
  - Primary: Neon Green (`#00ff00`)
  - Background: Dark (`#0d0d0d`, `#1a1a1a`)
  - Text: White (`#ffffff`)
- **Typography**: Inter & SF Pro Display fonts
- **Theme**: Dark mode with futuristic, tech-forward aesthetic
- **Design Language**: Geometric, sharp-edged components with glowing effects

### Logo Usage
The UA Designs logo appears in:
- Browser tab (favicon)
- Sidebar navigation
- Header bar
- All branded components

The logo features:
- 3D isometric "UA" block letters
- Neon green hexagonal outline
- Cursive "designs" script text
- Glowing animations and hover effects

## 📦 Key Dependencies

### Core Dependencies
- `react` & `react-dom` - React framework
- `react-router-dom` - Client-side routing
- `antd` - UI component library
- `zustand` - State management
- `axios` - HTTP client
- `react-hook-form` - Form handling
- `yup` - Schema validation
- `recharts` - Chart library

### Development Dependencies
- `typescript` - Type safety
- `vite` - Build tool and dev server
- `eslint` - Code linting
- `prettier` - Code formatting
- `@typescript-eslint/*` - TypeScript ESLint rules

## 🏗️ Architecture

### State Management
- **Zustand Stores**: Lightweight state management
  - `authStore` - Authentication state
  - `projectStore` - Project data management
  - `uiStore` - UI state (sidebar, notifications, etc.)

### API Layer
- **Service Classes**: Organized API calls
  - `apiService` - Base API configuration
  - `authService` - Authentication endpoints
  - `projectService` - Project management endpoints
  - `dashboardService` - Dashboard data endpoints

### Component Structure
- **Pages**: Top-level route components
- **Components**: Reusable UI components
- **Contexts**: React contexts for global state
- **Hooks**: Custom React hooks for logic reuse

## 🎯 PMBOK Knowledge Areas

The application covers all 10 PMBOK knowledge areas:

1. **Integration Management** - Project charter, change control
2. **Scope Management** - Requirements, WBS, scope control
3. **Schedule Management** - Gantt charts, critical path
4. **Cost Management** - Budget tracking, cost variance
5. **Quality Management** - Quality checks, standards
6. **Resource Management** - Team allocation, resource planning
7. **Communications** - Stakeholder communication
8. **Risk Management** - Risk register, mitigation plans
9. **Procurement Management** - Vendor management
10. **Stakeholder Management** - Stakeholder engagement

## 🔐 Authentication

The application includes:
- **Login/Register** pages
- **Forgot Password** functionality
- **Protected Routes** with authentication guards
- **Token-based** authentication
- **Role-based** access control (ready for implementation)

## 📊 Features

### Dashboard
- Project overview cards
- Progress tracking
- Recent activities
- Quick actions

### Project Management
- Project creation and editing
- Task management with Gantt charts
- Resource allocation
- Risk assessment matrix
- Cost tracking and variance analysis

### Analytics
- Project performance metrics
- Cost variance charts
- Risk distribution
- Timeline analysis

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Build Output
The build creates a `dist/` folder with:
- Optimized JavaScript bundles
- Minified CSS
- Static assets
- Source maps (for debugging)

### Deployment Options
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: AWS CloudFront, Cloudflare
- **Server**: Nginx, Apache

## 🧪 Code Quality

### Linting Rules
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **TypeScript**: Type safety

### Pre-commit Hooks (Recommended)
```bash
npm install --save-dev husky lint-staged
```

Add to `package.json`:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails with TypeScript Errors**
   ```bash
   # Use build without type checking
   npm run build
   
   # Or fix TypeScript issues
   npm run type-check
   ```

2. **Linting Errors**
   ```bash
   # Auto-fix issues
   npm run lint:fix
   
   # Format code
   npm run format
   ```

3. **Dependencies Issues**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Port Already in Use**
   ```bash
   # Kill process on port 5173
   npx kill-port 5173
   ```

## 🤝 Contributing

### Development Workflow
1. Create a feature branch
2. Make your changes
3. Run quality checks: `npm run check-all`
4. Commit with descriptive messages
5. Push and create a pull request

### Code Standards
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep components small and focused
- Use proper error handling

## 📞 Support

### Team Contacts
- **Frontend Lead**: [Your Name]
- **Backend Team**: [Backend Team Contact]
- **DevOps**: [DevOps Contact]

### Resources
- [React Documentation](https://react.dev/)
- [Ant Design Components](https://ant.design/components/overview)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

## 📄 License

This project is proprietary to UA Designs. All rights reserved.

---

**Happy Coding! 🚀**
