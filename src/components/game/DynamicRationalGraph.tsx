
'use client';

import type { RationalFunction } from '@/lib/game-data';
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface DynamicRationalGraphProps {
  func: RationalFunction;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  points?: number;
}

const X_DOMAIN_DEFAULT = [-10, 10];
const Y_DOMAIN_DEFAULT = [-10, 10];
const NUM_POINTS_DEFAULT = 200;

// Helper to parse numbers from strings like "x = -2" or "y = 1"
const parseValueFromString = (str: string | undefined): number | undefined => {
  if (!str) return undefined;
  const match = str.match(/=\s*(-?\d*\.?\d+)/);
  return match ? parseFloat(match[1]) : undefined;
};


export function DynamicRationalGraph({
  func,
  xMin = X_DOMAIN_DEFAULT[0],
  xMax = X_DOMAIN_DEFAULT[1],
  yMin = Y_DOMAIN_DEFAULT[0],
  yMax = Y_DOMAIN_DEFAULT[1],
  points = NUM_POINTS_DEFAULT,
}: DynamicRationalGraphProps) {
  const data = React.useMemo(() => {
    const generatedPoints: ({ x: number; y: number | null })[] = [];
    const step = (xMax - xMin) / (points - 1);
    
    // Prepare the evaluable function string
    // Ensure powers are JS compatible (**)
    const evaluableFuncStr = func.evaluableEquation.replace(/\^/g, '**');
    
    // eslint-disable-next-line no-new-func
    const plotFunction = new Function('x', 'try { const val = ' + evaluableFuncStr + '; return isFinite(val) ? val : null; } catch(e) { return null; }');

    const verticalAsymptoteValues = func.properties.verticalAsymptotes?.map(parseValueFromString).filter(v => v !== undefined) as number[] || [];

    for (let i = 0; i < points; i++) {
      const x = xMin + i * step;
      
      // Check if x is extremely close to an asymptote
      const atAsymptote = verticalAsymptoteValues.some(vaX => Math.abs(x - vaX) < 1e-9);
      if (atAsymptote) {
        generatedPoints.push({ x, y: null });
        continue;
      }
      
      let y = plotFunction(x) as number | null;

      if (y !== null && (y < yMin || y > yMax)) {
         // Clamp y values to be within yMin/yMax for better visualization if they shoot off to infinity
         // This is a simple clamp, can be improved
        if (y < yMin) y = yMin -1; // push it slightly out of bounds to show direction
        if (y > yMax) y = yMax +1; 
      }
      
      generatedPoints.push({ x, y });
    }
    return generatedPoints;
  }, [func, xMin, xMax, yMin, yMax, points]);

  const verticalAsymptotes = func.properties.verticalAsymptotes?.map(parseValueFromString).filter(v => v !== undefined) as number[] || [];
  const horizontalAsymptote = parseValueFromString(func.properties.horizontalAsymptote);
  
  // TODO: Add Slant Asymptotes and Holes later

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 10, // Reduced right margin
          left: -25, // Adjust left margin to pull Y-axis labels closer
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
        <XAxis 
          dataKey="x" 
          type="number" 
          domain={[xMin, xMax]} 
          tickCount={5} 
          stroke="hsl(var(--foreground) / 0.7)"
          tick={{ fontSize: 10 }} 
        />
        <YAxis 
          dataKey="y" 
          type="number" 
          domain={[yMin, yMax]} 
          tickCount={5} 
          stroke="hsl(var(--foreground) / 0.7)"
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            fontSize: '12px',
          }}
          itemStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Line
          type="monotone"
          dataKey="y"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          connectNulls={false} // Important for discontinuities
        />
        {verticalAsymptotes.map((vaX, index) => (
          <ReferenceLine 
            key={`va-${index}`} 
            x={vaX} 
            stroke="hsl(var(--destructive))" 
            strokeDasharray="4 4" 
            strokeOpacity={0.7}
          />
        ))}
        {horizontalAsymptote !== undefined && (
           <ReferenceLine 
            key="ha" 
            y={horizontalAsymptote} 
            stroke="hsl(var(--accent))" 
            strokeDasharray="4 4" 
            strokeOpacity={0.7}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
