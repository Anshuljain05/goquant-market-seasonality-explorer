
# GoQuant Market Seasonality Explorer

A modern market seasonality analysis and visualization application built with React, TypeScript, and Tailwind CSS.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm package manager

### Installation

1. Clone the repository:
```sh
git clone https://github.com/Anshuljain05/goquant-market-seasonality-explorer.git
cd goquant-market-seasonality-explorer
```

2. Install dependencies:
```sh
npm install
```

3. Start the development server:
```sh
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

## Technologies Used

This project is built with:

- **Vite** - Build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library
- **shadcn/ui** - UI component library
- **Tailwind CSS** - Utility-first CSS framework

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # Base UI components (shadcn/ui)
│   ├── charts/       # Chart components
│   ├── interactive-features/ # Interactivity controls
│   └── ...           # Other component folders
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and configurations
├── pages/            # Page components
├── services/         # API and data services
├── types/            # TypeScript type definitions
└── index.css         # Global styles
```

## Building for Production

```sh
npm run build
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request
