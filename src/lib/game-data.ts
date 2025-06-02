
export interface RationalFunction {
  id: string;
  equation: string; // For display
  evaluableEquation: string; // For Recharts, e.g., "(x-1)/(x+2)"
  isEliminated: boolean;
  properties: { 
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
    evaluableEquation: '(x - 1) / (x + 2)',
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
    evaluableEquation: 'x / (x**2 - 4)',
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
    // Simplified form is y = x + 1, for x !== 1
    // For plotting, we can use the simplified form and add a hole marker later
    evaluableEquation: '(x**2 - 1) / (x - 1)', // Or 'x + 1' if we handle hole separately
    isEliminated: false,
    properties: {
      holes: ['x = 1 (at y = 2)'], // The actual function has a hole here. (x-1)(x+1)/(x-1) = x+1
      yIntercept: 'y = 1 (if x=0)',
      xIntercepts: ['x = -1 (if y=0)'],
      domain: 'All real numbers except x = 1',
    }
  },
  {
    id: 'f4',
    equation: 'y = 2 / (x - 3)',
    evaluableEquation: '2 / (x - 3)',
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
    evaluableEquation: '(x**2 + 1) / x',
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
    // Simplified form is y = 3, for x !== 2
    evaluableEquation: '(3*x - 6) / (x - 2)', // Or '3' if we handle hole separately
    isEliminated: false,
    properties: {
      holes: ['x = 2 (at y = 3)'], // 3(x-2)/(x-2) = 3
      horizontalAsymptote: 'y = 3 (effectively)',
      yIntercept: 'y = 3',
      domain: 'All real numbers except x = 2',
    }
  },
];
