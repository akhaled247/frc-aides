export type AppRouteId = 'prog-collection' | 'pid-simulation' | 'tree-of-defeat';

export interface AppRoute {
  id: AppRouteId;
  label: string;
  path: string;
}

export const appRoutes: AppRoute[] = [
  { id: 'pid-simulation', label: 'PID Sim', path: '/pid-simulation' },
  { id: 'prog-collection', label: 'Prog Collection', path: '/prog-collection' },
  { id: 'tree-of-defeat', label: 'Tree of Defeat', path: '/tree-of-defeat' },
];

export const siteConfig = {
  title: 'FRC Aides — FIRST Programming Tools',
  description:
    'Browser PID tuning simulation, a searchable FIRST programming resource catalog, and Tree of Defeat path explorer.',
  url: 'https://aakhaled.com/frc-aides',
  author: 'Abdullah Khaled',
  github: 'https://github.com/akhaled247/frc-aides',
  mantik: 'https://mantik.netlify.app',
};
