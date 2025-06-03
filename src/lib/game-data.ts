
export interface RationalFunction {
  id: string;
  equation: string; // For display
  sillyName: string; // Silly human name
  graphImageUrl: string; // To display graph images (e.g., from Desmos)
  isEliminated: boolean;
  isActuallySecret?: boolean; // Used for game over display
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
    sillyName: 'Flippy Frankie',
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
    sillyName: 'Wobbly Wendy',
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
    sillyName: 'Holey Harvey',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      holes: ['x = 1 (at y = 2)'],
      yIntercept: 'y = 1',
      xIntercepts: ['x = -1'],
      domain: 'All real numbers except x = 1 (Function simplifies to y = x+1)',
    }
  },
  {
    id: 'f4',
    equation: 'y = 2 / (x - 3)',
    sillyName: 'Asymptotic Archie',
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
    sillyName: 'Slanty Sammy',
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
    sillyName: 'Constant Clyde',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      holes: ['x = 2 (at y = 3)'],
      horizontalAsymptote: 'y = 3',
      yIntercept: 'y = 3',
      domain: 'All real numbers except x = 2 (Function simplifies to y = 3)',
    }
  },
  {
    id: 'f7',
    equation: 'y = (x + 1) / (x - 1)',
    sillyName: 'Intersecting Izzy',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      verticalAsymptotes: ['x = 1'],
      horizontalAsymptote: 'y = 1',
      xIntercepts: ['x = -1'],
      yIntercept: 'y = -1',
      domain: 'All real numbers except x = 1',
    }
  },
  {
    id: 'f8',
    equation: 'y = (x^2 - 9) / (x + 3)',
    sillyName: 'Simplifying Sally',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      holes: ['x = -3 (at y = -6)'],
      yIntercept: 'y = -3',
      xIntercepts: ['x = 3'],
      domain: 'All real numbers except x = -3 (Function simplifies to y = x-3)',
    }
  },
  {
    id: 'f9',
    equation: 'y = 1 / x',
    sillyName: 'Reciprocal Rory',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      verticalAsymptotes: ['x = 0'],
      horizontalAsymptote: 'y = 0',
      domain: 'All real numbers except x = 0',
    }
  },
  {
    id: 'f10',
    equation: 'y = (x - 2) / ((x - 2)(x + 1))',
    sillyName: 'Cancelling Carl',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      holes: ['x = 2 (at y = 1/3)'],
      verticalAsymptotes: ['x = -1'],
      horizontalAsymptote: 'y = 0',
      yIntercept: 'y = 1',
      domain: 'All real numbers except x = 2 and x = -1 (Function simplifies to y = 1/(x+1))',
    }
  },
  {
    id: 'f11',
    equation: 'y = x^2 / (x - 1)',
    sillyName: 'Parabolic Penny',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      verticalAsymptotes: ['x = 1'],
      slantAsymptote: 'y = x + 1',
      xIntercepts: ['x = 0'],
      yIntercept: 'y = 0',
      domain: 'All real numbers except x = 1',
    }
  },
  {
    id: 'f12',
    equation: 'y = (x - 1)^2 / (x - 1)',
    sillyName: 'Linear Lenny',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      holes: ['x = 1 (at y = 0)'],
      xIntercepts: ['x = 1 (this is the hole location!)'],
      yIntercept: 'y = -1',
      domain: 'All real numbers except x = 1 (Function simplifies to y = x-1)',
    }
  },
  {
    id: 'f13',
    equation: 'y = 5 / (x^2 + 1)',
    sillyName: 'Bell-Curve Betty',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      horizontalAsymptote: 'y = 0',
      yIntercept: 'y = 5',
      domain: 'All real numbers',
    }
  },
  {
    id: 'f14',
    equation: 'y = (2x + 4) / (x + 2)',
    sillyName: 'Steady Stevie',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      holes: ['x = -2 (at y = 2)'],
      horizontalAsymptote: 'y = 2',
      yIntercept: 'y = 2',
      domain: 'All real numbers except x = -2 (Function simplifies to y = 2)',
    }
  },
  {
    id: 'f15',
    equation: 'y = x / (x - 3)',
    sillyName: 'Dividing Donna',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      verticalAsymptotes: ['x = 3'],
      horizontalAsymptote: 'y = 1',
      xIntercepts: ['x = 0'],
      yIntercept: 'y = 0',
      domain: 'All real numbers except x = 3',
    }
  },
  {
    id: 'f16',
    equation: 'y = (x^2 - x - 6) / (x - 3)',
    sillyName: 'Polynomial Pete',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      holes: ['x = 3 (at y = 5)'],
      yIntercept: 'y = 2',
      xIntercepts: ['x = -2'],
      domain: 'All real numbers except x = 3 (Function simplifies to y = x+2)',
    }
  },
  {
    id: 'f17',
    equation: 'y = (x + 1) / ((x - 1)(x - 2))',
    sillyName: 'Multi-Asymptote Marty',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      verticalAsymptotes: ['x = 1', 'x = 2'],
      horizontalAsymptote: 'y = 0',
      xIntercepts: ['x = -1'],
      yIntercept: 'y = 1/2',
      domain: 'All real numbers except x = 1 and x = 2',
    }
  },
  {
    id: 'f18',
    equation: 'y = (3x^2) / (x^2 + 1)',
    sillyName: 'Plateau Paul',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      horizontalAsymptote: 'y = 3',
      xIntercepts: ['x = 0'],
      yIntercept: 'y = 0',
      domain: 'All real numbers',
    }
  },
  {
    id: 'f19',
    equation: 'y = (x - 4) / (x^2 - 16)',
    sillyName: 'Vanishing Victor',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      holes: ['x = 4 (at y = 1/8)'],
      verticalAsymptotes: ['x = -4'],
      horizontalAsymptote: 'y = 0',
      yIntercept: 'y = 1/4',
      domain: 'All real numbers except x = 4 and x = -4 (Function simplifies to y = 1/(x+4))',
    }
  },
  {
    id: 'f20',
    equation: 'y = (x^3 - 1) / (x - 1)',
    sillyName: 'Cubic Cassandra',
    graphImageUrl: 'https://placehold.co/600x400.png',
    isEliminated: false,
    properties: {
      holes: ['x = 1 (at y = 3)'],
      yIntercept: 'y = 1',
      domain: 'All real numbers except x = 1 (Function simplifies to y = x^2+x+1, a parabola)',
    }
  },
];
