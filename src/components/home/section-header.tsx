import Link from "next/link";

type SectionHeaderProps = {
  id: string;
  title: string;
  link?: { label: string; href: string };
};

export function SectionHeader({ id, title, link }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-baseline justify-between gap-4 lg:mb-8">
      <h2 id={id} className="heading-page">
        {title}
      </h2>
      {link && (
        <Link href={link.href} className="link text-base">
          {link.label}
        </Link>
      )}
    </div>
  );
}
