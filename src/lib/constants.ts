/** Inline SVG used whenever a remote/local image fails to load. */
export const FALLBACK_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#0f1525"/>
        <stop offset="1" stop-color="#161d31"/>
      </linearGradient>
    </defs>
    <rect width="800" height="500" fill="url(#g)"/>
    <g fill="none" stroke="#6366f1" stroke-opacity="0.35" stroke-width="3">
      <path d="M330 210 L300 250 L330 290"/>
      <path d="M470 210 L500 250 L470 290"/>
      <line x1="430" y1="200" x2="370" y2="300"/>
    </g>
    <text x="400" y="360" text-anchor="middle" font-family="monospace" font-size="18" fill="#6f7a8e">preview unavailable</text>
  </svg>`,
)}`;

export interface NavItem {
  label: string;
  to: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Projects", to: "/projects" },
  { label: "Resume", to: "/resume" },
  { label: "Contact", to: "/contact" },
];

export const HOME_SECTIONS = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "achievements", label: "Achievements" },
] as const;

/** Max page size accepted by the backend (clamped server-side to 1..100). */
export const MAX_PAGE_SIZE = 100;
