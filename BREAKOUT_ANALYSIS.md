# Breakout Detection Analysis

## Overview
This document explains all the breakout detection mechanisms implemented in your stock trading application.

---

## 1. **SWING BREAKOUTS**

### Detection Function: `detectSwings(candles, lookback = 2)`
**Location:** Lines ~300-315

**How it works:**
- Identifies **swing highs** and **swing lows** in price data
- Uses a lookback period (default 2 candles) to find local peaks and troughs
- A swing high occurs when the current candle's high is greater than all surrounding candles
- A swing low occurs when the current candle's low is less than all surrounding candles

```javascript
function detectSwings(candles, lookback = 2) {
  const swings = { highs: [], lows: [] };
  for (let i = lookback; i < candles.length - lookback; i++) {
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;
    
    // Check if it's a swing high
    const isSwingHigh = Array.from({length: lookback * 2 + 1}, (_, idx) => idx !== lookback)
      .every(offset => currentHigh > candles[i - lookback + offset]?.high);
    
    // Check if it's a swing low
    const isSwingLow = Array.from({length: lookback * 2 + 1}, (_, idx) => idx !== lookback)
      .every(offset => currentLow < candles[i - lookback + offset]?.low);
    
    if (isSwingHigh) swings.highs.push({ index: i, price: currentHigh, time: candles[i].start_time });
    if (isSwingLow) swings.lows.push({ index: i, price: currentLow, time: candles[i].start_time });
  }
  return swings;
}
```

### Breakout Detection: `detectSwingBreakouts(candles, swings)`
**Location:** Lines ~317-330

**Breakout Conditions:**
- **Bullish Breakout:** Latest candle closes AND has high above recent swing high
- **Bearish Breakout:** Latest candle closes AND has low below recent swing low

```javascript
function detectSwingBreakouts(candles, swings) {
  const latestCandle = candles[candles.length - 1];
  const recentHigh = swings.highs[swings.highs.length - 1]?.price;
  const recentLow = swings.lows[swings.lows.length - 1]?.price;
  
  const bullish = latestCandle.close > recentHigh && latestCandle.high > recentHigh;
  const bearish = latestCandle.close < recentLow && latestCandle.low < recentLow;
  
  if (bullish) return { type: 'swing', direction: 'bullish', details: { level: recentHigh } };
  if (bearish) return { type: 'swing', direction: 'bearish', details: { level: recentLow } };
  return { type: null, direction: null, details: {} };
}
```

---

## 2. **SUPPORT & RESISTANCE BREAKOUTS**

### Detection Function: `detectSupportResistance(candles)`
**Location:** Lines ~700-730

**How it works:**
- Identifies local minima as **support levels**
- Identifies local maxima as **resistance levels**
- Uses 5-candle window (2 before, current, 2 after)
- Clusters nearby levels within 0.25% threshold
- Returns top 3 most recent support and resistance levels

```javascript
function detectSupportResistance(candles) {
  const supports = [];
  const resistances = [];

  for (let i = 2; i < candles.length - 2; i++) {
    const p2 = candles[i - 2].close, p1 = candles[i - 1].close;
    const c = candles[i].close, n1 = candles[i + 1].close, n2 = candles[i + 2].close;

    // Support: local minimum
    if (c < p1 && c < p2 && c < n1 && c < n2) supports.push(c);
    
    // Resistance: local maximum
    if (c > p1 && c > p2 && c > n1 && c > n2) resistances.push(c);
  }

  const clusteredSupports = clusterLevels(supports, 0.25);
  const clusteredResistances = clusterLevels(resistances, 0.25);

  return {
    supports: clusteredSupports.slice(-3),       // last 3 key supports
    resistances: clusteredResistances.slice(-3)  // last 3 key resistances
  };
}
```

### Breakout Detection: `detectSRBreakouts(candles, srLevels)`
**Location:** Lines ~332-342

**Breakout Conditions:**
- **Support Breakdown (Bearish):** Close AND low below support level
- **Resistance Breakout (Bullish):** Close AND high above resistance level

```javascript
function detectSRBreakouts(candles, srLevels) {
  const latestCandle = candles[candles.length - 1];
  const support = srLevels.supports[0]; // Latest support
  const resistance = srLevels.resistances[0]; // Latest resistance
  
  if (latestCandle.close < support && latestCandle.low < support) 
    return { type: 'support', direction: 'bearish', details: { level: support } };
  
  if (latestCandle.close > resistance && latestCandle.high > resistance) 
    return { type: 'resistance', direction: 'bullish', details: { level: resistance } };
  
  return { type: null, direction: null, details: {} };
}
```

---

## 3. **PIVOT POINT BREAKOUTS**

### Calculation Function: `calculatePivot(candles)`
**Location:** Lines ~344-349

**Formula:**
```
Pivot Point = (Previous High + Previous Low + Previous Close) / 3
```

```javascript
function calculatePivot(candles) {
  if (candles.length < 1) return null;
  const prev = candles[candles.length - 2] || candles[candles.length - 1];
  return (prev.high + prev.low + prev.close) / 3;
}
```

### Breakout Detection: `detectPivotBreakouts(candles)`
**Location:** Lines ~351-360

**Breakout Conditions:**
- **Bullish:** Close AND high above pivot point
- **Bearish:** Close AND low below pivot point

```javascript
function detectPivotBreakouts(candles) {
  if (candles.length < 2) return { type: null, direction: null, details: {} };
  const pivot = calculatePivot(candles);
  const latestCandle = candles[candles.length - 1];
  
  if (latestCandle.close > pivot && latestCandle.high > pivot) 
    return { type: 'pivot', direction: 'bullish', details: { level: pivot } };
  
  if (latestCandle.close < pivot && latestCandle.low < pivot) 
    return { type: 'pivot', direction: 'bearish', details: { level: pivot } };
  
  return { type: null, direction: null, details: {} };
}
```

---

## 4. **TRIANGLE & CHANNEL PATTERNS**

### Status: **NOT IMPLEMENTED**

The code currently does **NOT** have explicit triangle or channel pattern detection. However, you can implement them using these approaches:

### Suggested Triangle Detection:
```javascript
function detectTriangle(candles, minLength = 10) {
  if (candles.length < minLength) return null;
  
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  // Calculate trendlines
  const upperTrend = calculateTrendline(highs);
  const lowerTrend = calculateTrendline(lows);
  
  // Ascending Triangle: flat resistance, rising support
  if (Math.abs(upperTrend.slope) < 0.01 && lowerTrend.slope > 0.01) {
    return { type: 'ascending', resistance: upperTrend.level, support: lowerTrend };
  }
  
  // Descending Triangle: flat support, falling resistance
  if (Math.abs(lowerTrend.slope) < 0.01 && upperTrend.slope < -0.01) {
    return { type: 'descending', support: lowerTrend.level, resistance: upperTrend };
  }
  
  // Symmetrical Triangle: converging lines
  if (upperTrend.slope < -0.01 && lowerTrend.slope > 0.01) {
    return { type: 'symmetrical', upper: upperTrend, lower: lowerTrend };
  }
  
  return null;
}
```

### Suggested Channel Detection:
```javascript
function detectChannel(candles, minLength = 15) {
  if (candles.length < minLength) return null;
  
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  const upperTrend = calculateTrendline(highs);
  const lowerTrend = calculateTrendline(lows);
  
  // Parallel lines = channel
  const slopeDiff = Math.abs(upperTrend.slope - lowerTrend.slope);
  
  if (slopeDiff < 0.02) { // Nearly parallel
    if (upperTrend.slope > 0.01) {
      return { type: 'ascending', upper: upperTrend, lower: lowerTrend };
    } else if (upperTrend.slope < -0.01) {
      return { type: 'descending', upper: upperTrend, lower: lowerTrend };
    } else {
      return { type: 'horizontal', upper: upperTrend, lower: lowerTrend };
    }
  }
  
  return null;
}
```

---

## 5. **MAIN BREAKOUT DETECTION FLOW**

### Master Function: `detectBreakouts()`
**Location:** Lines ~363-410

**Execution Order:**
1. Get BANKNIFTY candles (symbol "26009")
2. Calculate swings
3. Calculate support/resistance levels
4. Check breakouts in priority order:
   - First: Swing breakouts
   - Second: Support/Resistance breakouts
   - Third: Pivot breakouts
5. Validate with top 5 stock contributions
6. Display result if valid

```javascript
function detectBreakouts() {
  const bnCandles = lastNCandles["26009"] || [];
  if (bnCandles.length < 3) return;

  const latestCandle = bnCandles[bnCandles.length - 1];
  const swings = detectSwings(bnCandles, 2);
  const srLevels = detectSupportResistance(bnCandles);

  // Check breakouts in priority order
  let breakout = detectSwingBreakouts(bnCandles, swings);
  if (!breakout.type) breakout = detectSRBreakouts(bnCandles, srLevels);
  if (!breakout.type) breakout = detectPivotBreakouts(bnCandles);

  if (breakout.type) {
    const contributions = analyzeContributions(breakout.direction, latestCandle);
    if (contributions.valid) {
      // Display breakout with contributing stocks
      displayBreakout(breakout, contributions);
    }
  }
}
```

---

## 6. **CONTRIBUTION VALIDATION**

### Function: `analyzeContributions(breakoutDirection, breakoutCandle)`
**Location:** Lines ~362-380

**Purpose:** Validates breakout by checking if top 5 weighted stocks support the direction

**Validation Rules:**
- Analyzes top 5 stocks by index weight
- Checks if stock movement aligns with breakout direction
- **Bullish:** Stock change > +0.1%
- **Bearish:** Stock change < -0.1%
- **Valid breakout:** At least 3 out of 5 stocks must contribute

```javascript
function analyzeContributions(breakoutDirection, breakoutCandle) {
  const top5 = Object.entries(INDEX_WEIGHTS).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const contributors = [];
  let contributingCount = 0;
  
  top5.forEach(([symbol, weight]) => {
    const candles = lastNCandles[symbol] || [];
    const stockCandle = candles.find(c => c.start_time === breakoutCandle.start_time);
    
    if (stockCandle) {
      const change = ((stockCandle.close - stockCandle.open) / stockCandle.open) * 100;
      const points = stockCandle.close - stockCandle.open;
      
      const significant = (breakoutDirection === 'bullish' && change > 0.1) || 
                         (breakoutDirection === 'bearish' && change < -0.1);
      
      if (significant) contributingCount++;
      contributors.push({ symbol, weight, change: change.toFixed(2), points: points.toFixed(2), significant });
    }
  });
  
  return { contributors, valid: contributingCount >= 3 };
}
```

---

## 7. **CLUSTERING ALGORITHM**

### Function: `clusterLevels(levels, threshold = 0.2)`
**Location:** Lines ~732-750

**Purpose:** Groups nearby price levels to avoid duplicate support/resistance

**How it works:**
- Sorts all levels
- Groups levels within threshold % of each other
- Returns average of each group

```javascript
function clusterLevels(levels, threshold = 0.2) {
  if (!levels.length) return [];
  levels.sort((a, b) => a - b);
  const clusters = [];
  let group = [levels[0]];

  for (let i = 1; i < levels.length; i++) {
    if (Math.abs(levels[i] - levels[i - 1]) / levels[i - 1] < threshold / 100) {
      group.push(levels[i]);
    } else {
      clusters.push(average(group));
      group = [levels[i]];
    }
  }
  clusters.push(average(group));
  return clusters;
}
```

---

## 8. **DISPLAY & ALERTS**

### Breakout Display
**Location:** Lines ~390-405

Shows detected breakout with:
- Breakout type (swing/support/resistance/pivot)
- Direction (bullish/bearish)
- Price level
- Contributing stocks with their point changes

### NIFTY BANK Alert
**Location:** Lines ~570-585

Triggers alert when open-close difference exceeds threshold:
- **1m interval:** 20 points
- **3m interval:** 25 points
- **5m interval:** 30 points
- **15m interval:** 70 points

---

## Summary Table

| Pattern Type | Detection Method | Breakout Condition | Status |
|-------------|------------------|-------------------|---------|
| **Swing** | Local peaks/troughs with lookback | Close & high/low beyond swing level | ✅ Implemented |
| **Support** | Local minima clustering | Close & low below support | ✅ Implemented |
| **Resistance** | Local maxima clustering | Close & high above resistance | ✅ Implemented |
| **Pivot** | (H+L+C)/3 formula | Close & high/low beyond pivot | ✅ Implemented |
| **Triangle** | Converging trendlines | - | ❌ Not Implemented |
| **Channel** | Parallel trendlines | - | ❌ Not Implemented |

---

## Recommendations

1. **Add Triangle Detection:** Implement ascending, descending, and symmetrical triangles
2. **Add Channel Detection:** Detect ascending, descending, and horizontal channels
3. **Improve Validation:** Add volume confirmation for breakouts
4. **Add Timeframe Analysis:** Cross-validate breakouts across multiple timeframes
5. **False Breakout Filter:** Add retest confirmation before signaling

---

## Usage in Code

The breakout detection runs automatically:
- Triggered on every live WebSocket update
- Runs when candle closes (time-based trigger)
- Updates the `#nextCandlePrediction` div with results
- Validates with top 5 stock contributions before displaying
