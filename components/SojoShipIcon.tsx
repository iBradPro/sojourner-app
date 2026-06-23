// Top-down line-art silhouette of a Starfleet vessel (USS Sojourner)
export default function SojoShipIcon({ size = 24, color = 'currentColor', strokeWidth = 1.5 }: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Saucer section — wide ellipse, ship heading up */}
      <ellipse cx="12" cy="8" rx="8" ry="5" />
      {/* Bridge dome */}
      <circle cx="12" cy="7.5" r="1.2" fill={color} stroke="none" />
      {/* Neck */}
      <path d="M10.8 13 L13.2 13" />
      {/* Secondary hull — tapered toward aft */}
      <path d="M10.2 13 L9.5 20 L14.5 20 L13.8 13 Z" />
      {/* Nacelle strut — port */}
      <path d="M10 16.5 L6.5 18" />
      {/* Nacelle strut — starboard */}
      <path d="M14 16.5 L17.5 18" />
      {/* Port nacelle */}
      <path d="M4 16.5 L6.5 16.5 L7 21 L4 21 Z" />
      {/* Starboard nacelle */}
      <path d="M17.5 16.5 L20 16.5 L20 21 L17 21 Z" />
      {/* Deflector dish glow — small arc on secondary hull fore */}
      <path d="M10.8 14.5 Q12 13.8 13.2 14.5" strokeWidth={strokeWidth * 0.8} />
    </svg>
  );
}
