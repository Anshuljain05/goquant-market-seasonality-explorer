# Architecture

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # Base UI components (shadcn/ui)
│   ├── charts/       # Chart components
│   ├── calendar-views/ # Calendar visualization components
│   └── interactive-features/ # User interaction components
├── contexts/         # React Context providers
├── hooks/           # Custom React hooks
├── lib/            # Utility functions and helpers
├── pages/          # Application pages/routes
├── services/       # API and WebSocket services
├── types/          # TypeScript type definitions
└── utils/          # Helper functions

## Component Architecture

### Core Components

1. DataDashboard (`components/data-dashboard.tsx`)
   - Main dashboard component
   - Orchestrates data flow between components
   - Manages layout and component composition

2. FinancialCalendar (`components/financial-calendar.tsx`)
   - Calendar-based visualization
   - Supports multiple view modes
   - Integrates with market data

### Chart Components

1. CandlestickChart
   - Price action visualization
   - Technical indicator overlays
   - Interactive zoom and pan

2. DepthChart
   - Market depth visualization
   - Buy/sell pressure indication
   - Real-time updates

3. OrderbookChart
   - Order book visualization
   - Price level aggregation
   - Real-time order updates

4. VolumeChart
   - Trading volume visualization
   - Time-based aggregation
   - Volume profile analysis

## State Management

### Context Providers

1. ThemeContext
   - Manages application theme
   - Handles dark/light mode
   - Custom theme configurations

### Custom Hooks

1. useRealtimeData
   - WebSocket data management
   - Real-time updates handling
   - Connection state management

2. useChartOptimization
   - Chart performance optimization
   - Data point decimation
   - Render optimization

## Data Flow

1. API Integration
   - REST API calls for historical data
   - WebSocket connections for real-time data
   - Multiple exchange support

2. Data Processing
   - Data normalization
   - Technical indicator calculation
   - Time series management

3. State Updates
   - React state management
   - Context updates
   - Component re-rendering optimization

## Performance Considerations

1. Data Management
   - Efficient data structures
   - Pagination and lazy loading
   - Cache management

2. Rendering Optimization
   - React.memo usage
   - useCallback and useMemo
   - Virtual scrolling for large datasets

3. Network Optimization
   - WebSocket connection management
   - Data throttling
   - Batch updates
