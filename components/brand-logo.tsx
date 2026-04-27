import Link from "next/link";

function Mark({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm ${className ?? ""}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8M8 11h6" />
      </svg>
    </span>
  );
}

export function BrandLogoLink() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5">
      <Mark />
      <span className="text-2xl font-semibold tracking-tight text-brand">
        KU PromptLearn
      </span>
    </Link>
  );
}

export function BrandHeroMark() {
  return (
    <div className="flex justify-center">
      <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-brand text-white shadow-md sm:size-[4.5rem]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-9 sm:size-10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M8 7h8M8 11h6" />
        </svg>
      </span>
    </div>
  );
}
