# 🚀 Quick Reference - Breakout Detection

## 📍 Where to Find Each Pattern in Your Code

```
Your HTML File Structure:
├─ Lines 1-200: HTML & CSS
├─ Lines 200-300: WebSocket & Data Handling
├─ Lines 300-330: ✅ SWING DETECTION
├─ Lines 332-342: ✅ SUPPORT/RESISTANCE BREAKOUTS
├─ Lines 344-360: ✅ PIVOT BREAKOUTS
├─ Lines 362-410: Main detectBreakouts() function
├─ Lines 570-585: NIFTY BANK Alert System
├─ Lines 700-750: ✅ SUPPORT/RESISTANCE DETECTION
└─ Lines 750+: Support functions & UI updates
```

---

## ✅ IMPLEMENTED PATTERNS

### 1️⃣ SWING BREAKOUTS

**Location:** Lines ~300-330

**Function Names:**
- `detectSwings(candles, lookback = 2)`
- `detectSwingBreakouts(candles, swings)`

**What it does:**
```
Finds local peaks (swing highs) and troughs (swing lows)
Detects when price breaks above/below these levels
```

**Visual:**
```
    *  ← Swing High
   / \
  /   \     * ← BREAKOUT!
 /     \   /
/       \ /
         *
```

**Breakout Conditions:**
- Bullish: `close > swingHigh AND high > swingHigh`
- Bearish: `close < swingLow AND low < swingLow`

**Parameters:**
- Lookback: 2 candles (checks 2 before and 2 after)

---

### 2️⃣ SUPPORT & RESISTANCE BREAKOUTS

**Location:** 
- Detection: Lines ~700-730
- Breakout Check: Lines ~332-342

**Function Names:**
- `detectSupportResistance(candles)`
- `detectSRBreakouts(candles, srLevels)`
- `clusterLevels(levels, threshold = 0.2)`

**What it does:**
```
Identifies price levels where stock repeatedly bounces
Support = floor (price bounces up)
Resistance = ceiling (price bounces down)
```

**Visual:**
```
49800 ----*----*----*---- Resistance
          |    |    * ← BREAKOUT!
          |    |   /
49500     *----*
```

**Breakout Conditions:**
- Bullish: `close > resistance AND high > resistance`
- Bearish: `close < support AND low < support`

**Parameters:**
- Window: 5 candles (2 before + current + 2 after)
- Clustering: 0.25% (groups nearby levels)
- Returns: Top 3 levels

---

### 3️⃣ PIVOT POINT BREAKOUTS

**Location:** Lines ~344-360

**Function Names:**
- `calculatePivot(candles)`
- `detectPivotBreakouts(candles)`

**What it does:**
```
Calculates pivot point from previous candle
Pivot = (High + Low + Close) / 3
Detects breakouts above/below this level
```

**Visual:**
```
         * ← Current candle
        /|
       / |
49766 ---+--- Pivot Point
     /
    * ← Previous candle
```

**Breakout Conditions:**
- Bullish: `close > pivot AND high > pivot`
- Bearish: `close < pivot AND low < pivot`

**Formula:**
```javascript
pivot = (prevHigh + prevLow + prevClose) / 3
```

---

## ❌ NOT IMPLEMENTED (Code Provided)

### 4️⃣ TRIANGLE PATTERNS

**Status:** Code ready in `TRIANGLE_CHANNEL_IMPLEMENTATION.js`

**Types:**
1. **Ascending Triangle** (Bullish bias)
   - Flat resistance + Rising support
   - Breakout above = BUY signal

2. **Descending Triangle** (Bearish bias)
   - Falling resistance + Flat support
   - Breakdown below = SELL signal

3. **Symmetrical Triangle** (Neutral)
   - Converging lines
   - Direction of breakout determines signal

**Visual:**
```
Ascending:
    *----*----*----*---- Flat top
   /    /    /    /
  /    /    /    /
 /    /    /    /
*----*----*----*--------- Rising bottom

Descending:
*----*----*----*--------- Falling top
 \    \    \    \
  \    \    \    \
   \    \    \    \
    *----*----*----*---- Flat bottom

Symmetrical:
    *----*----*
   / \  / \  /
  /   \/   \/
 /    /\   /\
*----*--*-*--*
```

**Function Names:**
- `detectTriangle(candles, minLength = 10)`
- `detectTriangleBreakout(candles, triangle)`

**Parameters:**
- Min Length: 10 candles
- R² threshold: 0.5 (trendline quality)

---

### 5️⃣ CHANNEL PATTERNS

**Status:** Code ready in `TRIANGLE_CHANNEL_IMPLEMENTATION.js`

**Types:**
1. **Ascending Channel** (Bullish trend)
   - Both lines rising
   - Breakout above = Continuation
   - Breakdown below = Reversal

2. **Descending Channel** (Bearish trend)
   - Both lines falling
   - Breakdown below = Continuation
   - Breakout above = Reversal

3. **Horizontal Channel** (Range-bound)
   - Flat lines
   - Breakout either direction = New trend

**Visual:**
```
Ascending:
    /  /  /  /  ← Upper line
   /  /  /  /
  /  /  /  /
 /  /  /  /  ← Lower line

Descending:
\  \  \  \  ← Upper line
 \  \  \  \
  \  \  \  \
   \  \  \  \  ← Lower line

Horizontal:
----*----*----*---- Upper
    |    |    |
----*----*----*---- Lower
```

**Function Names:**
- `detectChannel(candles, minLength = 15)`
- `detectChannelBreakout(candles, channel)`

**Parameters:**
- Min Length: 15 candles
- R² threshold: 0.6 (trendline quality)
- Parallel tolerance: 20% slope deviation

---

## 🎯 VALIDATION SYSTEM

**Location:** Lines ~362-380

**Function:** `analyzeContributions(breakoutDirection, breakoutCandle)`

**How it works:**
```
1. Gets top 5 stocks by weight:
   - HDFC Bank (31.86%)
   - ICICI Bank (20.14%)
   - SBI (17.83%)
   - Kotak (8.79%)
   - Axis (7.96%)

2. Checks each stock's movement:
   - Bullish: change > +0.1%
   - Bearish: change < -0.1%

3. Validates:
   - Need 3+ stocks contributing
   - Direction must match breakout
```

**Example:**
```javascript
// Bullish breakout detected
const contributions = analyzeContributions('bullish', latestCandle);

// Result:
{
  contributors: [
    { symbol: '1333', change: '+0.15%', significant: true },
    { symbol: '4963', change: '+0.12%', significant: true },
    { symbol: '3045', change: '+0.18%', significant: true },
    { symbol: '1922', change: '+0.08%', significant: false },
    { symbol: '5900', change: '+0.11%', significant: true }
  ],
  valid: true  // 4 out of 5 = VALID
}
```

---

## 🔄 DETECTION FLOW

```
┌─────────────────────────┐
│ WebSocket Update        │
│ (Every 1m/3m/5m/15m)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Update lastNCandles     │
│ (Store latest candles)  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ detectBreakouts()       │
│ (Main function)         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Get BANKNIFTY (26009)   │
│ candles                 │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Calculate Patterns:     │
│ • Swings                │
│ • S/R Levels            │
│ • Pivot                 │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Check Breakouts:        │
│ 1. Swing                │
│ 2. S/R                  │
│ 3. Pivot                │
└───────────┬─────────────┘
            │
            ▼
      ┌─────┴─────┐
      │           │
   Found?      Not Found
      │           │
      ▼           ▼
┌──────────┐  ┌────────┐
│ Validate │  │ Show   │
│ with     │  │ "No    │
│ Top 5    │  │ Break" │
└────┬─────┘  └────────┘
     │
     ▼
┌──────────┐
│ Valid?   │
│ (3+ OK)  │
└────┬─────┘
     │
  ┌──┴──┐
  │     │
 Yes   No
  │     │
  ▼     ▼
Show  Show
Signal Weak
```

---

## 📊 THRESHOLDS CHEAT SHEET

| Setting | Value | What it means |
|---------|-------|---------------|
| **Swing Lookback** | 2 | Checks 2 candles before & after |
| **S/R Window** | 5 | Uses 5 candles to find levels |
| **S/R Clustering** | 0.25% | Groups levels within 0.25% |
| **Contribution** | ±0.1% | Stock must move 0.1%+ |
| **Validation** | 3/5 | Need 3 of top 5 stocks |
| **Triangle Min** | 10 | Need 10+ candles |
| **Channel Min** | 15 | Need 15+ candles |
| **Trendline R²** | 0.5-0.6 | Quality of trendline fit |
| **NIFTY Alert 1m** | 20 pts | Alert if O-C > 20 |
| **NIFTY Alert 3m** | 25 pts | Alert if O-C > 25 |
| **NIFTY Alert 5m** | 30 pts | Alert if O-C > 30 |
| **NIFTY Alert 15m** | 70 pts | Alert if O-C > 70 |

---

## 🎨 UI DISPLAY

**Element:** `#nextCandlePrediction`

**Shows:**
```html
<strong>Resistance Breakout:</strong> Bullish ⬆️ @ 49800.00
<small>Contributors (4/5): 1333 (+0.15%), 4963 (+0.12%), 3045 (+0.18%), 5900 (+0.11%)</small>
```

**Colors:**
- Bullish: Green background (#1a3a1a)
- Bearish: Red background (#3a1a1a)
- No signal: Dark gray (#222)

---

## 🔧 HOW TO ADD TRIANGLE & CHANNEL

### Step 1: Open your HTML file

### Step 2: Find the `<script>` section

### Step 3: Copy functions from `TRIANGLE_CHANNEL_IMPLEMENTATION.js`:
- `linearRegression()`
- `calculateTrendlineValue()`
- `findSwingHighs()`
- `findSwingLows()`
- `detectTriangle()`
- `detectTriangleBreakout()`
- `detectChannel()`
- `detectChannelBreakout()`
- `detectAllBreakouts()`

### Step 4: Replace this line:
```javascript
detectBreakouts();
```

### With this:
```javascript
detectAllBreakouts();
```

### Step 5: Save and reload

### Done! ✅

---

## 🐛 DEBUGGING COMMANDS

**Check candles:**
```javascript
console.log(lastNCandles["26009"]);
```

**Check swings:**
```javascript
const swings = detectSwings(lastNCandles["26009"], 2);
console.log("Swings:", swings);
```

**Check S/R:**
```javascript
const sr = detectSupportResistance(lastNCandles["26009"]);
console.log("Support:", sr.supports);
console.log("Resistance:", sr.resistances);
```

**Check pivot:**
```javascript
const pivot = calculatePivot(lastNCandles["26009"]);
console.log("Pivot:", pivot);
```

**Check breakout:**
```javascript
// Add this inside detectBreakouts() function
console.log("Breakout detected:", breakout);
console.log("Contributions:", contributions);
```

---

## 📈 PATTERN PRIORITY

When multiple patterns detected, checks in this order:

1. **Swing** (highest priority)
2. **Support/Resistance**
3. **Pivot**
4. **Triangle** (if implemented)
5. **Channel** (if implemented)

First match wins and gets displayed.

---

## 💡 QUICK TIPS

✅ **DO:**
- Wait for candle close before trading
- Check contribution validation (3+ stocks)
- Use multiple timeframes for confirmation
- Set stop loss below/above breakout level

❌ **DON'T:**
- Trade on wicks alone (need close beyond level)
- Ignore contribution validation
- Trade without stop loss
- Chase breakouts after large move

---

## 📞 NEED HELP?

1. **Understanding patterns?** → Read `BREAKOUT_ANALYSIS.md`
2. **Want examples?** → Read `BREAKOUT_EXAMPLES.md`
3. **Need code?** → Copy from `TRIANGLE_CHANNEL_IMPLEMENTATION.js`
4. **Quick overview?** → You're reading it! 😊

---

## ✅ CHECKLIST

Current Status:
- [x] Swing detection working
- [x] S/R detection working
- [x] Pivot detection working
- [x] Contribution validation working
- [x] NIFTY alert system working
- [ ] Triangle detection (code ready)
- [ ] Channel detection (code ready)

To complete:
- [ ] Copy triangle/channel code
- [ ] Replace detectBreakouts() call
- [ ] Test with live data
- [ ] Verify all patterns display correctly

---

**That's it! You now have a complete reference for all breakout patterns in your code! 🚀📈**
