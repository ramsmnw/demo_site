/**
 * TRIANGLE AND CHANNEL PATTERN DETECTION
 * Implementation for missing patterns in your stock trading application
 * 
 * Add these functions to your HTML file's <script> section
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Linear Regression - Calculate trendline from price points
 * @param {Array} points - Array of {price, index} objects
 * @returns {Object} - {slope, intercept, r2} for the trendline
 */
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
  
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
  
  points.forEach(p => {
    sumX += p.index;
    sumY += p.price;
    sumXY += p.index * p.price;
    sumXX += p.index * p.index;
    sumYY += p.price * p.price;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R² (coefficient of determination)
  const yMean = sumY / n;
  const ssTotal = sumYY - n * yMean * yMean;
  const ssResidual = points.reduce((sum, p) => {
    const predicted = slope * p.index + intercept;
    return sum + Math.pow(p.price - predicted, 2);
  }, 0);
  const r2 = 1 - (ssResidual / ssTotal);
  
  return { slope, intercept, r2 };
}

/**
 * Calculate trendline value at specific index
 */
function calculateTrendlineValue(trendline, index) {
  return trendline.slope * index + trendline.intercept;
}

/**
 * Find swing highs in candle data
 */
function findSwingHighs(candles, lookback = 2) {
  const swingHighs = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const isHigh = Array.from({length: lookback * 2 + 1}, (_, idx) => idx !== lookback)
      .every(offset => candles[i].high >= candles[i - lookback + offset]?.high);
    
    if (isHigh) {
      swingHighs.push({ price: candles[i].high, index: i, time: candles[i].start_time });
    }
  }
  return swingHighs;
}

/**
 * Find swing lows in candle data
 */
function findSwingLows(candles, lookback = 2) {
  const swingLows = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const isLow = Array.from({length: lookback * 2 + 1}, (_, idx) => idx !== lookback)
      .every(offset => candles[i].low <= candles[i - lookback + offset]?.low);
    
    if (isLow) {
      swingLows.push({ price: candles[i].low, index: i, time: candles[i].start_time });
    }
  }
  return swingLows;
}

// ============================================================================
// TRIANGLE PATTERN DETECTION
// ============================================================================

/**
 * Detect Triangle Patterns (Ascending, Descending, Symmetrical)
 * @param {Array} candles - Array of candle objects with OHLC data
 * @param {Number} minLength - Minimum candles required for pattern
 * @returns {Object|null} - Triangle pattern details or null
 */
function detectTriangle(candles, minLength = 10) {
  if (candles.length < minLength) return null;
  
  // Get recent candles for analysis
  const recentCandles = candles.slice(-minLength);
  
  // Find swing points
  const swingHighs = findSwingHighs(recentCandles, 1);
  const swingLows = findSwingLows(recentCandles, 1);
  
  if (swingHighs.length < 3 || swingLows.length < 3) return null;
  
  // Calculate trendlines
  const upperTrend = linearRegression(swingHighs);
  const lowerTrend = linearRegression(swingLows);
  
  // Check R² values (trendline quality)
  if (upperTrend.r2 < 0.5 || lowerTrend.r2 < 0.5) return null;
  
  const upperSlope = upperTrend.slope;
  const lowerSlope = lowerTrend.slope;
  
  // Calculate convergence point
  const convergenceIndex = (upperTrend.intercept - lowerTrend.intercept) / 
                          (lowerTrend.slope - upperTrend.slope);
  
  // Ascending Triangle: Flat resistance (~0 slope), Rising support (positive slope)
  if (Math.abs(upperSlope) < 0.001 && lowerSlope > 0.01) {
    const resistanceLevel = upperTrend.intercept;
    const currentSupport = calculateTrendlineValue(lowerTrend, recentCandles.length - 1);
    
    return {
      type: 'ascending',
      pattern: 'triangle',
      resistance: resistanceLevel,
      support: currentSupport,
      upperTrend: upperTrend,
      lowerTrend: lowerTrend,
      convergenceIn: Math.max(0, convergenceIndex - recentCandles.length),
      bullishBias: true,
      swingHighs: swingHighs,
      swingLows: swingLows
    };
  }
  
  // Descending Triangle: Falling resistance (negative slope), Flat support (~0 slope)
  if (upperSlope < -0.01 && Math.abs(lowerSlope) < 0.001) {
    const supportLevel = lowerTrend.intercept;
    const currentResistance = calculateTrendlineValue(upperTrend, recentCandles.length - 1);
    
    return {
      type: 'descending',
      pattern: 'triangle',
      resistance: currentResistance,
      support: supportLevel,
      upperTrend: upperTrend,
      lowerTrend: lowerTrend,
      convergenceIn: Math.max(0, convergenceIndex - recentCandles.length),
      bearishBias: true,
      swingHighs: swingHighs,
      swingLows: swingLows
    };
  }
  
  // Symmetrical Triangle: Converging lines (opposite slopes)
  if (upperSlope < -0.01 && lowerSlope > 0.01) {
    const currentResistance = calculateTrendlineValue(upperTrend, recentCandles.length - 1);
    const currentSupport = calculateTrendlineValue(lowerTrend, recentCandles.length - 1);
    
    return {
      type: 'symmetrical',
      pattern: 'triangle',
      resistance: currentResistance,
      support: currentSupport,
      upperTrend: upperTrend,
      lowerTrend: lowerTrend,
      convergenceIn: Math.max(0, convergenceIndex - recentCandles.length),
      neutral: true,
      swingHighs: swingHighs,
      swingLows: swingLows
    };
  }
  
  return null;
}

/**
 * Detect Triangle Breakout
 * @param {Array} candles - Array of candle objects
 * @param {Object} triangle - Triangle pattern from detectTriangle()
 * @returns {Object|null} - Breakout details or null
 */
function detectTriangleBreakout(candles, triangle) {
  if (!triangle) return null;
  
  const latestCandle = candles[candles.length - 1];
  const index = candles.length - 1;
  
  // Calculate current trendline levels
  const resistanceLevel = calculateTrendlineValue(triangle.upperTrend, index);
  const supportLevel = calculateTrendlineValue(triangle.lowerTrend, index);
  
  // Ascending Triangle - Bullish breakout expected
  if (triangle.type === 'ascending') {
    if (latestCandle.close > resistanceLevel && latestCandle.high > resistanceLevel) {
      return {
        type: 'triangle',
        pattern: 'ascending',
        direction: 'bullish',
        details: {
          level: resistanceLevel,
          breakoutStrength: ((latestCandle.close - resistanceLevel) / resistanceLevel) * 100,
          expectedMove: resistanceLevel - supportLevel // Height of triangle
        }
      };
    }
    // False breakdown (bearish in ascending = false signal)
    if (latestCandle.close < supportLevel && latestCandle.low < supportLevel) {
      return {
        type: 'triangle',
        pattern: 'ascending',
        direction: 'bearish',
        details: {
          level: supportLevel,
          falseBreakdown: true,
          warning: 'Unexpected breakdown in ascending triangle'
        }
      };
    }
  }
  
  // Descending Triangle - Bearish breakdown expected
  if (triangle.type === 'descending') {
    if (latestCandle.close < supportLevel && latestCandle.low < supportLevel) {
      return {
        type: 'triangle',
        pattern: 'descending',
        direction: 'bearish',
        details: {
          level: supportLevel,
          breakoutStrength: ((supportLevel - latestCandle.close) / supportLevel) * 100,
          expectedMove: resistanceLevel - supportLevel
        }
      };
    }
    // False breakout (bullish in descending = false signal)
    if (latestCandle.close > resistanceLevel && latestCandle.high > resistanceLevel) {
      return {
        type: 'triangle',
        pattern: 'descending',
        direction: 'bullish',
        details: {
          level: resistanceLevel,
          falseBreakout: true,
          warning: 'Unexpected breakout in descending triangle'
        }
      };
    }
  }
  
  // Symmetrical Triangle - Direction matters
  if (triangle.type === 'symmetrical') {
    if (latestCandle.close > resistanceLevel && latestCandle.high > resistanceLevel) {
      return {
        type: 'triangle',
        pattern: 'symmetrical',
        direction: 'bullish',
        details: {
          level: resistanceLevel,
          breakoutStrength: ((latestCandle.close - resistanceLevel) / resistanceLevel) * 100,
          expectedMove: resistanceLevel - supportLevel
        }
      };
    }
    if (latestCandle.close < supportLevel && latestCandle.low < supportLevel) {
      return {
        type: 'triangle',
        pattern: 'symmetrical',
        direction: 'bearish',
        details: {
          level: supportLevel,
          breakoutStrength: ((supportLevel - latestCandle.close) / supportLevel) * 100,
          expectedMove: resistanceLevel - supportLevel
        }
      };
    }
  }
  
  return null;
}

// ============================================================================
// CHANNEL PATTERN DETECTION
// ============================================================================

/**
 * Detect Channel Patterns (Ascending, Descending, Horizontal)
 * @param {Array} candles - Array of candle objects with OHLC data
 * @param {Number} minLength - Minimum candles required for pattern
 * @returns {Object|null} - Channel pattern details or null
 */
function detectChannel(candles, minLength = 15) {
  if (candles.length < minLength) return null;
  
  const recentCandles = candles.slice(-minLength);
  
  // Find swing points
  const swingHighs = findSwingHighs(recentCandles, 2);
  const swingLows = findSwingLows(recentCandles, 2);
  
  if (swingHighs.length < 3 || swingLows.length < 3) return null;
  
  // Calculate trendlines
  const upperTrend = linearRegression(swingHighs);
  const lowerTrend = linearRegression(swingLows);
  
  // Check R² values (trendline quality)
  if (upperTrend.r2 < 0.6 || lowerTrend.r2 < 0.6) return null;
  
  // Check if lines are parallel (similar slopes)
  const slopeDiff = Math.abs(upperTrend.slope - lowerTrend.slope);
  const avgSlope = (Math.abs(upperTrend.slope) + Math.abs(lowerTrend.slope)) / 2;
  const slopeDeviation = avgSlope > 0 ? slopeDiff / avgSlope : slopeDiff;
  
  // Lines must be parallel (within 20% deviation)
  if (slopeDeviation > 0.2) return null;
  
  const avgSlopeValue = (upperTrend.slope + lowerTrend.slope) / 2;
  const channelWidth = Math.abs(upperTrend.intercept - lowerTrend.intercept);
  
  // Ascending Channel: Both lines rising
  if (avgSlopeValue > 0.01) {
    return {
      type: 'ascending',
      pattern: 'channel',
      upperTrend: upperTrend,
      lowerTrend: lowerTrend,
      width: channelWidth,
      slope: avgSlopeValue,
      bullishBias: true,
      swingHighs: swingHighs,
      swingLows: swingLows,
      currentResistance: calculateTrendlineValue(upperTrend, recentCandles.length - 1),
      currentSupport: calculateTrendlineValue(lowerTrend, recentCandles.length - 1)
    };
  }
  
  // Descending Channel: Both lines falling
  if (avgSlopeValue < -0.01) {
    return {
      type: 'descending',
      pattern: 'channel',
      upperTrend: upperTrend,
      lowerTrend: lowerTrend,
      width: channelWidth,
      slope: avgSlopeValue,
      bearishBias: true,
      swingHighs: swingHighs,
      swingLows: swingLows,
      currentResistance: calculateTrendlineValue(upperTrend, recentCandles.length - 1),
      currentSupport: calculateTrendlineValue(lowerTrend, recentCandles.length - 1)
    };
  }
  
  // Horizontal Channel: Flat lines
  if (Math.abs(avgSlopeValue) <= 0.01) {
    return {
      type: 'horizontal',
      pattern: 'channel',
      resistance: upperTrend.intercept,
      support: lowerTrend.intercept,
      width: channelWidth,
      neutral: true,
      swingHighs: swingHighs,
      swingLows: swingLows,
      currentResistance: calculateTrendlineValue(upperTrend, recentCandles.length - 1),
      currentSupport: calculateTrendlineValue(lowerTrend, recentCandles.length - 1)
    };
  }
  
  return null;
}

/**
 * Detect Channel Breakout
 * @param {Array} candles - Array of candle objects
 * @param {Object} channel - Channel pattern from detectChannel()
 * @returns {Object|null} - Breakout details or null
 */
function detectChannelBreakout(candles, channel) {
  if (!channel) return null;
  
  const latestCandle = candles[candles.length - 1];
  const index = candles.length - 1;
  
  const upperLevel = calculateTrendlineValue(channel.upperTrend, index);
  const lowerLevel = calculateTrendlineValue(channel.lowerTrend, index);
  
  // Breakout above channel (Bullish)
  if (latestCandle.close > upperLevel && latestCandle.high > upperLevel) {
    return {
      type: 'channel',
      pattern: channel.type,
      direction: 'bullish',
      details: {
        level: upperLevel,
        breakoutStrength: ((latestCandle.close - upperLevel) / upperLevel) * 100,
        channelWidth: channel.width,
        expectedMove: channel.width, // Typically moves by channel width
        bias: channel.type === 'ascending' ? 'continuation' : 'reversal'
      }
    };
  }
  
  // Breakdown below channel (Bearish)
  if (latestCandle.close < lowerLevel && latestCandle.low < lowerLevel) {
    return {
      type: 'channel',
      pattern: channel.type,
      direction: 'bearish',
      details: {
        level: lowerLevel,
        breakoutStrength: ((lowerLevel - latestCandle.close) / lowerLevel) * 100,
        channelWidth: channel.width,
        expectedMove: channel.width,
        bias: channel.type === 'descending' ? 'continuation' : 'reversal'
      }
    };
  }
  
  return null;
}

// ============================================================================
// INTEGRATED DETECTION FUNCTION
// ============================================================================

/**
 * Detect all pattern types including Triangle and Channel
 * This replaces/extends your existing detectBreakouts() function
 */
function detectAllBreakouts() {
  const predictionBox = document.getElementById("nextCandlePrediction");
  if (!predictionBox) return;
  
  const bnCandles = lastNCandles["26009"] || [];
  if (bnCandles.length < 5) return;
  
  const latestCandle = bnCandles[bnCandles.length - 1];
  
  // Existing detections
  const swings = detectSwings(bnCandles, 2);
  const srLevels = detectSupportResistance(bnCandles);
  
  // New detections
  const triangle = detectTriangle(bnCandles, 10);
  const channel = detectChannel(bnCandles, 15);
  
  // Check breakouts in priority order
  let breakout = detectSwingBreakouts(bnCandles, swings);
  if (!breakout.type) breakout = detectSRBreakouts(bnCandles, srLevels);
  if (!breakout.type) breakout = detectPivotBreakouts(bnCandles);
  if (!breakout.type) breakout = detectTriangleBreakout(bnCandles, triangle);
  if (!breakout.type) breakout = detectChannelBreakout(bnCandles, channel);
  
  if (breakout && breakout.type) {
    const contributions = analyzeContributions(breakout.direction, latestCandle);
    
    if (contributions.valid) {
      const directionText = breakout.direction === 'bullish' ? 'Bullish ⬆️' : 'Bearish ⬇️';
      const level = breakout.details?.level?.toFixed(2) || 'N/A';
      const patternName = breakout.pattern ? `${breakout.pattern.charAt(0).toUpperCase() + breakout.pattern.slice(1)} ` : '';
      const typeText = `${patternName}${breakout.type.charAt(0).toUpperCase() + breakout.type.slice(1)}`;
      
      const contribText = contributions.contributors
        .filter(c => c.significant)
        .map(c => `${c.symbol} (${c.change}%)`)
        .join(', ');
      
      let extraInfo = '';
      if (breakout.details?.expectedMove) {
        extraInfo = `<br><small>Expected Move: ~${breakout.details.expectedMove.toFixed(2)} pts</small>`;
      }
      if (breakout.details?.warning) {
        extraInfo += `<br><small style="color: orange;">⚠️ ${breakout.details.warning}</small>`;
      }
      
      predictionBox.innerHTML = `
        <strong>${typeText} Breakout:</strong> ${directionText} @ ${level}
        <br><small>Contributors (${contributions.contributors.filter(c => c.significant).length}/5): ${contribText}</small>
        ${extraInfo}
      `;
      predictionBox.style.background = breakout.direction === 'bullish' ? '#1a3a1a' : '#3a1a1a';
    } else {
      predictionBox.innerHTML = `<strong>Weak Signal</strong> (Insufficient contributions)`;
      predictionBox.style.background = '#222';
    }
  } else {
    // Show active patterns even without breakout
    let patternInfo = '';
    if (triangle) {
      patternInfo = `<strong>${triangle.type.charAt(0).toUpperCase() + triangle.type.slice(1)} Triangle Forming</strong>
                     <br><small>Resistance: ${triangle.resistance.toFixed(2)} | Support: ${triangle.support.toFixed(2)}</small>`;
    } else if (channel) {
      patternInfo = `<strong>${channel.type.charAt(0).toUpperCase() + channel.type.slice(1)} Channel Active</strong>
                     <br><small>Upper: ${channel.currentResistance.toFixed(2)} | Lower: ${channel.currentSupport.toFixed(2)}</small>`;
    } else {
      patternInfo = `<strong>No Breakout Detected</strong>`;
    }
    predictionBox.innerHTML = patternInfo;
    predictionBox.style.background = '#222';
  }
}

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================

/*
 * HOW TO INTEGRATE INTO YOUR HTML FILE:
 * 
 * 1. Copy all functions above into your <script> section
 * 
 * 2. Replace the call to detectBreakouts() with detectAllBreakouts()
 *    Find this line in your code:
 *    detectBreakouts();
 *    
 *    Replace with:
 *    detectAllBreakouts();
 * 
 * 3. The new function will automatically detect:
 *    - Swing breakouts (existing)
 *    - Support/Resistance breakouts (existing)
 *    - Pivot breakouts (existing)
 *    - Triangle breakouts (NEW)
 *    - Channel breakouts (NEW)
 * 
 * 4. Test with different intervals (1m, 3m, 5m, 15m) to see patterns
 * 
 * 5. Optional: Add visual indicators on chart (requires chart library)
 */

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
// Example 1: Detect triangle pattern
const candles = lastNCandles["26009"];
const triangle = detectTriangle(candles, 10);
if (triangle) {
  console.log(`${triangle.type} triangle detected!`);
  console.log(`Resistance: ${triangle.resistance}`);
  console.log(`Support: ${triangle.support}`);
}

// Example 2: Detect channel pattern
const channel = detectChannel(candles, 15);
if (channel) {
  console.log(`${channel.type} channel detected!`);
  console.log(`Upper: ${channel.currentResistance}`);
  console.log(`Lower: ${channel.currentSupport}`);
}

// Example 3: Check for breakouts
const triangleBreakout = detectTriangleBreakout(candles, triangle);
if (triangleBreakout) {
  console.log(`Triangle breakout: ${triangleBreakout.direction}`);
  console.log(`Expected move: ${triangleBreakout.details.expectedMove}`);
}
*/
