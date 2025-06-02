export interface RationalFunction {
  id: string;
  equation: string;
  graphImageUrl: string;
  isEliminated: boolean;
  descriptionForAI: string;
  properties: { // For easier filtering if needed, and for display
    verticalAsymptotes?: string[];
    horizontalAsymptote?: string;
    slantAsymptote?: string;
    holes?: string[];
    xIntercepts?: string[];
    yIntercept?: string;
    domain?: string;
    range?: string;
  };
}

export const INITIAL_FUNCTIONS: RationalFunction[] = [
  {
    id: 'f1',
    equation: 'y = (x - 1) / (x + 2)',
    graphImageUrl: 'https://placehold.co/300x200.png',
    isEliminated: false,
    descriptionForAI: 'This function has a vertical asymptote at x = -2, a horizontal asymptote at y = 1. The x-intercept is at x = 1, and the y-intercept is at y = -0.5. No holes.',
    properties: {
      verticalAsymptotes: ['x = -2'],
      horizontalAsymptote: 'y = 1',
      xIntercepts: ['x = 1'],
      yIntercept: 'y = -0.5',
      domain: 'All real numbers except x = -2',
    }
  },
  {
    id: 'f2',
    equation: 'y = x / (x^2 - 4)',
    graphImageUrl: 'https://placehold.co/300x200.png',
    isEliminated: false,
    descriptionForAI: 'This function has vertical asymptotes at x = 2 and x = -2. It has a horizontal asymptote at y = 0. The x-intercept is at x = 0, which is also the y-intercept. No holes.',
    properties: {
      verticalAsymptotes: ['x = 2', 'x = -2'],
      horizontalAsymptote: 'y = 0',
      xIntercepts: ['x = 0'],
      yIntercept: 'y = 0',
      domain: 'All real numbers except x = 2 and x = -2',
    }
  },
  {
    id: 'f3',
    equation: 'y = (x^2 - 1) / (x - 1)',
    graphImageUrl: 'https://placehold.co/300x200.png',
    isEliminated: false,
    descriptionForAI: 'This function simplifies to y = x + 1, but has a hole at x = 1. It has no vertical asymptotes and no horizontal asymptote, but behaves like a line. The y-intercept is y = 1. The x-intercept would be x = -1 if not for the hole.',
    properties: {
      holes: ['x = 1 (at y = 2)'],
      yIntercept: 'y = 1 (if x=0)',
      xIntercepts: ['x = -1 (if y=0)'],
      domain: 'All real numbers except x = 1',
    }
  },
  {
    id: 'f4',
    equation: 'y = 2 / (x - 3)',
    graphImageUrl: 'https://placehold.co/300x200.png',
    isEliminated: false,
    descriptionForAI: 'A simple rational function with a vertical asymptote at x = 3 and a horizontal asymptote at y = 0. It has no x-intercepts and a y-intercept at y = -2/3. No holes.',
    properties: {
      verticalAsymptotes: ['x = 3'],
      horizontalAsymptote: 'y = 0',
      yIntercept: 'y = -2/3',
      domain: 'All real numbers except x = 3',
    }
  },
  {
    id: 'f5',
    equation: 'y = (x^2 + 1) / x',
    graphImageUrl: 'https://placehold.co/300x200.png',
    isEliminated: false,
    descriptionForAI: 'This function has a vertical asymptote at x = 0 and a slant asymptote y = x. It has no x-intercepts (since x^2+1 is never 0) and no y-intercept (due to asymptote at x=0). No holes.',
    properties: {
      verticalAsymptotes: ['x = 0'],
      slantAsymptote: 'y = x',
      domain: 'All real numbers except x = 0',
    }
  },
  {
    id: 'f6',
    equation: 'y = (3x - 6) / (x - 2)',
    graphImageUrl: 'https://placehold.co/300x200.png',
    isEliminated: false,
    descriptionForAI: 'This function simplifies to y = 3 for x not equal to 2. It has a hole at x = 2. It is a horizontal line y = 3 with a point discontinuity. No vertical or other asymptotes.',
    properties: {
      holes: ['x = 2 (at y = 3)'],
      horizontalAsymptote: 'y = 3 (effectively)',
      yIntercept: 'y = 3',
      domain: 'All real numbers except x = 2',
    }
  },
];
