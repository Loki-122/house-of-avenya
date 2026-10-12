/**
 * Stroke icons for the admin panel.
 *
 * Inline 24x24 SVG paths (lucide-style geometry) so the
 * panel needs no icon dependency. Every icon shares the
 * currentColor stroke and a 1.5 stroke width, matching
 * the storefront's icon treatment.
 */

const ICON_PATHS: Record<string, string[]> = {
  dashboard: ['M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z'],
  products: [
    'M20.5 6.5a2.5 2.5 0 0 0-2.4-3.2 4.5 4.5 0 0 0-4.6 1.4L8.4 9.7a4.5 4.5 0 0 0-1.4 4.6 2.5 2.5 0 0 0 3.2 2.4l6.1-6.1a4.5 4.5 0 0 0 1.4-4.6z',
    'M8.4 9.7l6.1 6.1',
  ],
  inventory: [
    'M21 8l-9-5-9 5v8l9 5 9-5V8z',
    'M3 8l9 5 9-5',
    'M12 13v8',
    'M7.5 5.5l9 5',
  ],
  orders: ['M6 2h12v20l-3-2-3 2-3-2-3 2V2z', 'M9 7h6M9 11h6'],
  customers: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  coupons: [
    'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z',
    'M7 7h.01',
  ],
  reviews: [
    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  ],
  settings: [
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  ],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  menu: ['M3 6h18M3 12h18M3 18h18'],
  close: ['M18 6L6 18M6 6l12 12'],
  arrowLeft: ['M19 12H5M12 19l-7-7 7-7'],
  arrowRight: ['M5 12h14M12 5l7 7-7 7'],
  alertTriangle: [
    'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
    'M12 9v4',
    'M12 17h.01',
  ],
  xCircle: ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z', 'M15 9l-6 6', 'M9 9l6 6'],
  checkCircle: ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4L12 14.01l-3-3'],
  clock: ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z', 'M12 6v6l4 2'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  tag: ['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z', 'M7 7h.01'],
  grid: ['M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z'],
  plus: ['M12 5v14M5 12h14'],
  box: [
    'M21 8l-9-5-9 5v8l9 5 9-5V8z',
    'M3 8l9 5 9-5',
    'M12 13v8',
  ],
  layers: ['M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'],
  users: [
    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M23 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  percent: ['M19 5L5 19', 'M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', 'M17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  messageSquare: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  signIn: ['M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4', 'M10 17l5-5-5-5', 'M15 12H3'],
  check: ['M20 6L9 17l-5-5'],
  eye: ['M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10 7Z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'],
  edit: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z'],
  chevronDown: ['M6 9l6 6 6-6'],
  chevronUp: ['M18 15l-6-6-6 6'],
  fileText: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M8 13h8', 'M8 17h8', 'M8 9h.01'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
  mapPin: ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  creditCard: ['M21 4H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z', 'M16 10h2', 'M12 10h.01', 'M3 10h.01'],
  truck: ['M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2', 'M14 18a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-6', 'M14 6h6', 'M6 18h.01'],
  rupee: ['M6 3 3 9l12 12', 'M6 15h9', 'M18 15h2'],
  externalLink: ['M15 3h6v6', 'M9 21V9l12-12'],
  copy: ['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2', 'M13 3h7v7'],
  filter: ['M22 2H2l8 9.46V19l4 2v-8.54L22 2Z'],
  spinner: ['M12 2v4', 'M12 18v4', 'M4.93 4.93l2.83 2.83', 'M16.24 16.24l2.83 2.83', 'M2 12h4', 'M18 12h4', 'M4.93 19.07l2.83-2.83', 'M16.24 7.76l2.83-2.83'],
};

export type AdminIconName = keyof typeof ICON_PATHS;

export function AdminIcon({
  name,
  size = 18,
  className,
}: {
  name: AdminIconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
