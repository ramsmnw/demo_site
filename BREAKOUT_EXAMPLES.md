# Breakout Detection - Visual Examples & Code Flow

## 📊 Visual Representation of Each Pattern

### 1. SWING BREAKOUT

```
Price Chart:
         
    *  ← Swing High (Resistance)
   / \
  /   \     * ← BREAKOUT! (Price breaks above swing high)
 /     \   /|
/       \ / |
         *  |
            ↑
         Bullish Breakout

Bearish Example:
         *
        / \
       /   \
      /     \
     /       \
    *         ← Swing Low (Support)
     \
      * ← BREAKDOWN! (Price breaks below swing low)
```

**Code Flow:**
```javascript
// Step 1: Find swing points
const swings = detectSwings(candles, 2);
// Returns: { highs: [{index: 5, price: 50000}], lows: [{index: 3, price: 49500}] }

// Step 2: Check if latest candle breaks swing level
const breakout = detectSwingBreakouts(candles, swings);
// Returns: { type: 'swing', direction: 'bullish', details: { level: 50000 } }
```

---

### 2. SUPPORT & RESISTANCE BREAKOUT

```
Resistance Breakout (Bullish):

49800 ----*----*----*---- Resistance Level
          |    |    |
          |    |    * ← BREAKOUT!
          |    |   /|
          |    |  / |
          |    | /  |
49500     *----*    |
                    ↑
                 Bullish

Support Breakdown (Bearish):

49500     *----*----*
          |    |    |
          |    |    |
          |    |    * ← BREAKDOWN!
          |    |    |\
          |    |    | \
49200 ----*----*----*--\-- Support Level
                        ↓
                     Bearish
```

**Code Flow:**
```javascript
// Step 1: Detect S/R levels from historical data
const srLevels = detectSupportResistance(candles);
// Returns: { 
//   supports: [49200, 49100, 49000], 
//   resistances: [49800, 49900, 50000] 
// }

// Step 2: Check breakout
const breakout = detectSRBreakouts(candles, srLevels);
// Returns: { type: 'resistance', direction: 'bullish', details: { level: 49800 } }
```

---

### 3. PIVOT POINT BREAKOUT

```
Pivot Calculation:
Previous Candle: High=50000, Low=49500, Close=49800
Pivot = (50000 + 49500 + 49800) / 3 = 49766.67

Bullish Breakout:
         
         * ← Current candle breaks above pivot
        /|
       / |
49766 ---+--- Pivot Point
     /   |
    *    |
         ↑
      Bullish

Bearish Breakdown:
    *
    |
    |
49766 ---+--- Pivot Point
     |   \
     |    \
     |     * ← Current candle breaks below pivot
           ↓
        Bearish
```

**Code Flow:**
```javascript
// Step 1: Calculate pivot from previous candle
const pivot = calculatePivot(candles);
// Returns: 49766.67

// Step 2: Check if current candle breaks pivot
const breakout = detectPivotBreakouts(candles);
// Returns: { type: 'pivot', direction: 'bullish', details: { level: 49766.67 } }
```

---

### 4. TRIANGLE PATTERN (Not Implemented - Example)

```
Ascending Triangle:
         
    *----*----*----*---- Flat Resistance
   /    /    /    /
  /    /    /    /
 /    /    /    /
*----*----*----*--------- Rising Support
         
         * ← Breakout above resistance = BULLISH
        /|
       / |
      /  |

Descending Triangle:
         
*----*----*----*--------- Falling Resistance
 \    \    \    \
  \    \    \    \
   \    \    \    \
    *----*----*----*---- Flat Support
                   \
                    * ← Breakdown below support = BEARISH

Symmetrical Triangle:
         
    *----*----*
   / \  / \  /
  /   \/   \/
 /    /\   /\
*----*--*-*--*
         
    Breakout direction determines signal
```

**Suggested Implementation:**
```javascript
function detectTriangle(candles, minLength = 10) {
  if (candles.length < minLength) return null;
  
  // Get recent highs and lows
  const recentCandles = candles.slice(-minLength);
  const highs = recentCandles.map((c, i) => ({ price: c.high, index: i }));
  const lows = recentCandles.map((c, i) => ({ price: c.low, index: i }));
  
  // Calculate trendlines using linear regression
  const upperTrend = linearRegression(highs);
  const lowerTrend = linearRegression(lows);
  
  // Ascending: flat top, rising bottom
  if (Math.abs(upperTrend.slope) < 0.001 && lowerTrend.slope > 0.01) {
    return {
      type: 'ascending',
      resistance: upperTrend.intercept,
      supportSlope: lowerTrend.slope,
      bullishBias: true
    };
  }
  
  // Descending: falling top, flat bottom
  if (upperTrend.slope < -0.01 && Math.abs(lowerTrend.slope) < 0.001) {
    return {
      type: 'descending',
      support: lowerTrend.intercept,
      resistanceSlope: upperTrend.slope,
      bearishBias: true
    };
  }
  
  // Symmetrical: converging lines
  if (upperTrend.slope < -0.01 && lowerTrend.slope > 0.01) {
    const convergencePoint = (upperTrend.intercept - lowerTrend.intercept) / 
                            (lowerTrend.slope - upperTrend.slope);
    return {
      type: 'symmetrical',
      convergenceIndex: convergencePoint,
      neutral: true
    };
  }
  
  return null;
}

function detectTriangleBreakout(candles, triangle) {
  const latestCandle = candles[candles.length - 1];
  
  if (triangle.type === 'ascending') {
    if (latestCandle.close > triangle.resistance && 
        latestCandle.high > triangle.resistance) {
      return { type: 'triangle', direction: 'bullish', pattern: 'ascending' };
    }
  }
  
  if (triangle.type === 'descending') {
    if (latestCandle.close < triangle.support && 
        latestCandle.low < triangle.support) {
      return { type: 'triangle', direction: 'bearish', pattern: 'descending' };
    }
  }
  
  if (triangle.type === 'symmetrical') {
    const resistance = calculateTrendlineValue(triangle.upperTrend, candles.length - 1);
    const support = calculateTrendlineValue(triangle.lowerTrend, candles.length - 1);
    
    if (latestCandle.close > resistance) {
      return { type: 'triangle', direction: 'bullish', pattern: 'symmetrical' };
    }
    if (latestCandle.close < support) {
      return { type: 'triangle', direction: 'bearish', pattern: 'symmetrical' };
    }
  }
  
  return null;
}
```

---

### 5. CHANNEL PATTERN (Not Implemented - Example)

```
Ascending Channel:
         
    /  /  /  /  ← Upper trendline (resistance)
   /  /  /  /
  /  /  /  /
 /  /  /  /  ← Lower trendline (support)
/  /  /  /

Breakout above = BULLISH
Breakdown below = BEARISH

Descending Channel:
         
\  \  \  \  ← Upper trendline (resistance)
 \  \  \  \
  \  \  \  \
   \  \  \  \  ← Lower trendline (support)

Horizontal Channel:
         
----*----*----*---- Upper bound
    |    |    |
    |    |    |
----*----*----*---- Lower bound
```

**Suggested Implementation:**
```javascript
function detectChannel(candles, minLength = 15) {
  if (candles.length < minLength) return null;
  
  const recentCandles = candles.slice(-minLength);
  const highs = recentCandles.map((c, i) => ({ price: c.high, index: i }));
  const lows = recentCandles.map((c, i) => ({ price: c.low, index: i }));
  
  const upperTrend = linearRegression(highs);
  const lowerTrend = linearRegression(lows);
  
  // Check if lines are parallel (similar slopes)
  const slopeDiff = Math.abs(upperTrend.slope - lowerTrend.slope);
  
  if (slopeDiff < 0.02) { // Parallel within tolerance
    const channelWidth = upperTrend.intercept - lowerTrend.intercept;
    
    if (upperTrend.slope > 0.01) {
      return {
        type: 'ascending',
        upper: upperTrend,
        lower: lowerTrend,
        width: channelWidth,
        bullishBias: true
      };
    } else if (upperTrend.slope < -0.01) {
      return {
        type: 'descending',
        upper: upperTrend,
        lower: lowerTrend,
        width: channelWidth,
        bearishBias: true
      };
    } else {
      return {
        type: 'horizontal',
        resistance: upperTrend.intercept,
        support: lowerTrend.intercept,
        width: channelWidth,
        neutral: true
      };
    }
  }
  
  return null;
}

function detectChannelBreakout(candles, channel) {
  const latestCandle = candles[candles.length - 1];
  const index = candles.length - 1;
  
  const upperLevel = channel.upper.slope * index + channel.upper.intercept;
  const lowerLevel = channel.lower.slope * index + channel.lower.intercept;
  
  // Breakout above channel
  if (latestCandle.close > upperLevel && latestCandle.high > upperLevel) {
    return {
      type: 'channel',
      direction: 'bullish',
      pattern: channel.type,
      level: upperLevel
    };
  }
  
  // Breakdown below channel
  if (latestCandle.close < lowerLevel && latestCandle.low < lowerLevel) {
    return {
      type: 'channel',
      direction: 'bearish',
      pattern: channel.type,
      level: lowerLevel
    };
  }
  
  return null;
}

// Helper: Linear regression for trendline
function linearRegression(points) {
  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  points.forEach(p => {
    sumX += p.index;
    sumY += p.price;
    sumXY += p.index * p.price;
    sumXX += p.index * p.index;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}
```

---

## 🔄 Complete Detection Flow

```
┌─────────────────────────────────────┐
│   WebSocket receives live update    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Update lastNCandles array         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   detectBreakouts() triggered       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Get BANKNIFTY candles (26009)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Calculate patterns:               │
│   • detectSwings()                  │
│   • detectSupportResistance()       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Check breakouts (priority order): │
│   1. detectSwingBreakouts()         │
│   2. detectSRBreakouts()            │
│   3. detectPivotBreakouts()         │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────┴──────┐
        │             │
    Breakout?      No breakout
        │             │
        ▼             ▼
┌─────────────┐  ┌──────────────────┐
│ Analyze top │  │ Display "No      │
│ 5 stocks    │  │ Breakout"        │
└──────┬──────┘  └──────────────────┘
       │
       ▼
  ┌────────┐
  │ Valid? │ (3+ stocks contributing)
  └───┬────┘
      │
  ┌───┴────┐
  │        │
 Yes       No
  │        │
  ▼        ▼
┌────┐  ┌──────────────┐
│Show│  │ Display      │
│    │  │ "Insufficient│
│    │  │ contributions"│
└────┘  └──────────────┘
```

---

## 📝 Real Example Walkthrough

### Scenario: Detecting a Resistance Breakout

**Input Data:**
```javascript
const candles = [
  { start_time: '2025-11-11T10:00:00', open: 49500, high: 49600, low: 49450, close: 49580 },
  { start_time: '2025-11-11T10:01:00', open: 49580, high: 49650, low: 49550, close: 49620 },
  { start_time: '2025-11-11T10:02:00', open: 49620, high: 49700, low: 49600, close: 49680 },
  { start_time: '2025-11-11T10:03:00', open: 49680, high: 49750, low: 49650, close: 49720 },
  { start_time: '2025-11-11T10:04:00', open: 49720, high: 49800, low: 49700, close: 49780 },
  { start_time: '2025-11-11T10:05:00', open: 49780, high: 49850, low: 49750, close: 49820 }, // BREAKOUT!
];
```

**Step 1: Detect Support/Resistance**
```javascript
const srLevels = detectSupportResistance(candles);
// Result: { supports: [49450], resistances: [49800] }
```

**Step 2: Check Latest Candle**
```javascript
const latestCandle = candles[5];
// { open: 49780, high: 49850, low: 49750, close: 49820 }

// Check conditions:
// close (49820) > resistance (49800) ✓
// high (49850) > resistance (49800) ✓
```

**Step 3: Detect Breakout**
```javascript
const breakout = detectSRBreakouts(candles, srLevels);
// Result: { type: 'resistance', direction: 'bullish', details: { level: 49800 } }
```

**Step 4: Validate with Top 5 Stocks**
```javascript
const contributions = analyzeContributions('bullish', latestCandle);
// Checks: HDFC Bank, ICICI Bank, SBI, Kotak, Axis
// Result: { 
//   contributors: [
//     { symbol: '1333', weight: 31.86, change: '+0.15', points: '+7.50', significant: true },
//     { symbol: '4963', weight: 20.14, change: '+0.12', points: '+5.20', significant: true },
//     { symbol: '3045', weight: 17.83, change: '+0.18', points: '+4.80', significant: true },
//     { symbol: '1922', weight: 8.79, change: '+0.08', points: '+2.10', significant: false },
//     { symbol: '5900', weight: 7.96, change: '+0.11', points: '+3.50', significant: true }
//   ],
//   valid: true  // 4 out of 5 contributing
// }
```

**Step 5: Display Result**
```javascript
// HTML Output:
// "Resistance Breakout: Bullish (49800.00)
//  Contributors (4/5): 1333 (+7.50 pts, +0.15%), 4963 (+5.20 pts, +0.12%), 
//                      3045 (+4.80 pts, +0.18%), 5900 (+3.50 pts, +0.11%)"
```

---

## 🎯 Key Thresholds & Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Swing Lookback | 2 candles | Window for swing high/low detection |
| S/R Window | 5 candles | Local min/max detection (2 before + current + 2 after) |
| Clustering Threshold | 0.25% | Group nearby S/R levels |
| Contribution Threshold | ±0.1% | Significant stock movement |
| Validation Requirement | 3/5 stocks | Minimum contributors for valid breakout |
| NIFTY Alert (1m) | 20 points | Open-close difference alert |
| NIFTY Alert (3m) | 25 points | Open-close difference alert |
| NIFTY Alert (5m) | 30 points | Open-close difference alert |
| NIFTY Alert (15m) | 70 points | Open-close difference alert |

---

## 🚀 Enhancement Suggestions

### 1. Add Volume Confirmation
```javascript
function validateWithVolume(candle, avgVolume) {
  return candle.volume > avgVolume * 1.5; // 50% above average
}
```

### 2. Add Retest Confirmation
```javascript
function waitForRetest(candles, breakoutLevel, direction) {
  const nextCandle = candles[candles.length - 1];
  if (direction === 'bullish') {
    // Price should stay above breakout level
    return nextCandle.low > breakoutLevel * 0.998; // 0.2% tolerance
  } else {
    return nextCandle.high < breakoutLevel * 1.002;
  }
}
```

### 3. Multi-Timeframe Confirmation
```javascript
async function confirmAcrossTimeframes(symbol, breakoutType) {
  const timeframes = ['5m', '15m'];
  const confirmations = [];
  
  for (const tf of timeframes) {
    const candles = await fetchCandles(symbol, tf);
    const breakout = detectBreakout(candles);
    if (breakout.type === breakoutType) {
      confirmations.push(tf);
    }
  }
  
  return confirmations.length >= 2; // Confirmed in 2+ timeframes
}
```

### 4. False Breakout Filter
```javascript
function isFalseBreakout(candles, breakoutIndex, level, direction) {
  // Check if price quickly reversed
  const nextCandles = candles.slice(breakoutIndex + 1, breakoutIndex + 4);
  
  if (direction === 'bullish') {
    // False if price closes back below level within 3 candles
    return nextCandles.some(c => c.close < level);
  } else {
    return nextCandles.some(c => c.close > level);
  }
}
```

---

## 📊 Testing Your Breakout Detection

### Test Case 1: Swing High Breakout
```javascript
const testCandles = [
  { high: 100, low: 95, close: 98 },
  { high: 102, low: 97, close: 100 },  // Swing high
  { high: 101, low: 96, close: 99 },
  { high: 103, low: 98, close: 101 },
  { high: 105, low: 100, close: 104 }  // Breakout!
];

const swings = detectSwings(testCandles, 1);
console.log(swings); // Should show swing high at index 1 (price 102)

const breakout = detectSwingBreakouts(testCandles, swings);
console.log(breakout); // Should show bullish swing breakout
```

### Test Case 2: Support Breakdown
```javascript
const testCandles = [
  { high: 105, low: 100, close: 102 },
  { high: 104, low: 99, close: 101 },
  { high: 103, low: 98, close: 100 },  // Support at 98
  { high: 102, low: 97, close: 99 },
  { high: 101, low: 96, close: 97 }    // Breakdown!
];

const srLevels = detectSupportResistance(testCandles);
console.log(srLevels); // Should show support around 98

const breakout = detectSRBreakouts(testCandles, srLevels);
console.log(breakout); // Should show bearish support breakdown
```

---

## 🔍 Debugging Tips

1. **Log swing points:**
```javascript
console.log('Detected swings:', swings);
```

2. **Log S/R levels:**
```javascript
console.log('Support levels:', srLevels.supports);
console.log('Resistance levels:', srLevels.resistances);
```

3. **Log breakout checks:**
```javascript
console.log('Latest candle:', latestCandle);
console.log('Checking against level:', level);
console.log('Close condition:', latestCandle.close > level);
console.log('High condition:', latestCandle.high > level);
```

4. **Log contributions:**
```javascript
console.log('Top 5 contributions:', contributions);
console.log('Valid breakout?', contributions.valid);
```
