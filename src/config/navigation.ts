export type AppRouteId = 'prog-collection' | 'pid-simulation';

export interface AppRoute {
  id: AppRouteId;
  label: string;
  path: string;
}

export const appRoutes: AppRoute[] = [
  { id: 'pid-simulation', label: 'PID Sim', path: '/pid-simulation' },
  { id: 'prog-collection', label: 'Prog Collection', path: '/prog-collection' },
];

export const siteConfig = {
  title: 'FRC Aides — FIRST Programming Tools',
  description:
    'Browser PID tuning simulation and a searchable catalog of FIRST programming resources.',
  url: 'https://aakhaled.com/frc-aides',
  author: 'Abdullah Khaled',
  github: 'https://github.com/akhaled247/frc-aides',
  mantik: 'https://mantik.netlify.app',
};
