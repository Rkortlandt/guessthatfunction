
export interface RationalFunction {
  id: string;
  equation: string; // For display
  graphImageUrl: string; // To display graph images (e.g., from Desmos)
  isEliminated: boolean;
  // Properties are kept for potential future use or if players want to inspect them,
  // but they are not directly used for AI hints anymore.
  properties: { 
    verticalAsymptotes?: string[];
    horizontalAsymptote?: string;
    slantAsymptote?: string;
    holes?: string[]; // e.g. "x = 1 (at y = 2)"
    xIntercepts?: string[]; // e.g. "x = 0"
    yIntercept?: string; // e.g. "y = 0"
    domain?: string; // e.g. "All real numbers except x = -2"
    range?: string;
  };
}

export const INITIAL_FUNCTIONS: RationalFunction[] = [
  {
    id: 'f1',
    equation: 'y = (x - 1) / (x + 2)',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
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
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
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
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
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
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
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
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      verticalAsymptotes: ['x = 0'],
      slantAsymptote: 'y = x',
      domain: 'All real numbers except x = 0',
    }
  },
  {
    id: 'f6',
    equation: 'y = (3x - 6) / (x - 2)',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      holes: ['x = 2 (at y = 3)'], 
      horizontalAsymptote: 'y = 3 (effectively)', // This is a constant function y=3 after hole cancellation
      yIntercept: 'y = 3',
      domain: 'All real numbers except x = 2',
    }
  },
];
