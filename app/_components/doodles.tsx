type DoodleProps = {
  className?: string;
};

export function DoodleUnderline({ className }: DoodleProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 120 10"
    >
      <path d="M2 7.2C28 4.7 55 6.6 80 4.6C95 3.4 106 3.6 118 2.8" />
    </svg>
  );
}

export function DoodleArrow({ className }: DoodleProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 28 16"
    >
      <path d="M1.5 8.4C8.8 8 16.2 8 25 7.5M19.8 2.2C21.6 4.5 23.5 6.1 26 7.4C23.7 9 21.8 11 20.2 13.6" />
    </svg>
  );
}
