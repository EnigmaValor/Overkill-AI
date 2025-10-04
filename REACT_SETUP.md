# React Setup - Advanced Password Manager

This document describes the React/TypeScript setup added to the Magic AI Builder project.

## Component Overview

The Advanced Password Manager is a comprehensive React component that provides:

1. **Password Strength Checker**
   - Real-time password strength evaluation
   - Visual indicators (5-level strength meter)
   - Requirements checklist (length, uppercase, lowercase, numbers, special characters)
   - Show/hide password toggle

2. **Password Generator**
   - Customizable length (6-30 characters)
   - Character type selection (uppercase, lowercase, numbers, symbols)
   - Copy to clipboard functionality
   - Real-time generation

3. **Shamir Secret Sharing (Simulation)**
   - Configurable threshold (k) and total shares (n)
   - Generates multiple shares for password distribution
   - Individual share copying

4. **Password Encryption (Simulation)**
   - Simple encryption demonstration
   - Base64 encoding
   - Copy encrypted password

## File Structure

```
/workspace/
├── src/
│   ├── components/
│   │   └── AdvancedPasswordManager.tsx  # Main component
│   ├── App.tsx                          # App entry component
│   ├── main.tsx                         # React entry point
│   ├── index.css                        # Global styles with Tailwind
│   └── vite-env.d.ts                    # Vite type definitions
├── index.html                           # HTML entry point
├── package.json                         # Dependencies and scripts
├── tsconfig.json                        # TypeScript configuration
├── tsconfig.node.json                   # TypeScript config for Vite
├── vite.config.ts                       # Vite bundler configuration
├── tailwind.config.js                   # Tailwind CSS configuration
└── postcss.config.js                    # PostCSS configuration
```

## Getting Started

### Installation

Install Node.js dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

This will create optimized files in `static/dist/` that can be served by the Flask application.

### Linting

Run the linter:

```bash
npm run lint
```

## Technologies Used

- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **ESLint** - Code linting

## Integration with Flask

The Vite build output is configured to go to `static/dist/`. You can serve the React app from Flask by:

1. Building the React app: `npm run build`
2. Creating a new Flask route to serve the index.html from `static/dist/`

Example Flask integration:

```python
@app.route("/password-manager")
def password_manager():
    return send_from_directory('static/dist', 'index.html')
```

## Notes

- The cryptographic features (Shamir Secret Sharing and encryption) are **simulations** for demonstration purposes only
- For production use, implement proper cryptographic libraries (e.g., Web Crypto API, crypto-js)
- The component uses Tailwind CSS for styling
- All password operations are performed client-side only (no server communication)

## Security Considerations

⚠️ **Important**: This is a demonstration component. For production use:

1. Implement real cryptographic algorithms
2. Use Web Crypto API for encryption
3. Use a proper Shamir Secret Sharing library
4. Consider using a cryptographically secure random number generator
5. Add proper error handling and validation
6. Implement rate limiting if connected to a backend
7. Never store passwords in plain text

## Component Features

### Password Strength Checker
- ✅ Real-time validation
- ✅ Visual strength meter
- ✅ Requirement indicators
- ✅ Show/hide toggle

### Password Generator
- ✅ Adjustable length
- ✅ Character type options
- ✅ Random generation
- ✅ Copy to clipboard

### Shamir Secret Sharing
- ✅ Configurable parameters
- ✅ Multiple share generation
- ✅ Individual share copying

### Encryption
- ✅ Key-based encryption
- ✅ Base64 output
- ✅ Copy functionality

### UI/UX
- ✅ Responsive design
- ✅ Modern gradient background
- ✅ Card-based layout
- ✅ Accessible form controls
- ✅ Clear visual feedback
