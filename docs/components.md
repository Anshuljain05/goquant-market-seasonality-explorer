# Components Documentation

## UI Components

### Base Components (ui/)

1. **Button (`button.tsx`)**
   - Primary action component
   - Variants: primary, secondary, ghost, link
   - Size options: sm, md, lg

2. **Input (`input.tsx`)**
   - Text input component
   - Support for validation
   - Error state handling

3. **Select (`select.tsx`)**
   - Dropdown selection component
   - Custom styling options
   - Multi-select support

4. **Calendar (`calendar.tsx`)**
   - Date selection component
   - Range selection support
   - Custom date formatting

### Chart Components (charts/)

1. **CandlestickChart (`CandlestickChart.tsx`)**
   ```typescript
   interface CandlestickProps {
     data: OHLCV[];
     width?: number;
     height?: number;
     options?: ChartOptions;
   }
   ```
   - OHLC price visualization
   - Technical indicator support
   - Interactive tools

2. **DepthChart (`DepthChart.tsx`)**
   - Market depth visualization
   - Buy/sell order distribution
   - Real-time updates

3. **OrderbookChart (`OrderbookChart.tsx`)**
   - Order book visualization
   - Price aggregation levels
   - Real-time order flow

4. **VolumeChart (`VolumeChart.tsx`)**
   - Volume analysis tools
   - Time-based aggregation
   - Custom period selection

### Calendar Views (calendar-views/)

1. **DailyView (`daily-view.tsx`)**
   - Daily market analysis
   - Intraday patterns
   - Custom time ranges

2. **WeeklyView (`weekly-view.tsx`)**
   - Weekly market patterns
   - Week-over-week comparison
   - Historical analysis

3. **MonthlyView (`monthly-view.tsx`)**
   - Monthly market trends
   - Seasonal patterns
   - Year-over-year analysis

### Interactive Features (interactive-features/)

1. **DateRangeSelector (`date-range-selector.tsx`)**
   - Custom date range selection
   - Preset periods
   - Range validation

2. **FilterControls (`filter-controls.tsx`)**
   - Data filtering options
   - Custom filter criteria
   - Filter persistence

3. **ZoomControls (`zoom-controls.tsx`)**
   - Chart zoom functionality
   - Pan controls
   - Reset options

4. **Tooltip (`tooltip.tsx`)**
   - Custom data tooltips
   - Position management
   - Content formatting

## Main Components

1. **DataDashboard (`data-dashboard.tsx`)**
   - Main application container
   - Component composition
   - Layout management

2. **FinancialCalendar (`financial-calendar.tsx`)**
   - Calendar-based analysis
   - Multiple view modes
   - Data visualization

## Component Best Practices

1. **Performance**
   - Use React.memo for pure components
   - Implement useCallback for handlers
   - Optimize re-renders

2. **State Management**
   - Local state for UI
   - Context for shared state
   - Props for component configuration

3. **Styling**
   - Tailwind CSS utilities
   - CSS modules for custom styles
   - Theme consistency

4. **Accessibility**
   - ARIA attributes
   - Keyboard navigation
   - Screen reader support
