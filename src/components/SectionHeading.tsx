interface SectionHeadingProps {
  label?: string;
  title: string;
  description?: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export default function SectionHeading({
  label,
  title,
  description,
  className = '',
  align = 'center',
}: SectionHeadingProps) {
  const alignClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  return (
    <div className={`flex flex-col gap-4 ${alignClasses[align]} ${className}`}>
      {label && (
        <span className="text-brand-antiqueGold uppercase tracking-widest text-xs font-medium animate-slide-up">
          {label}
        </span>
      )}
      <h2 className="font-display text-display-md text-brand-espresso animate-slide-up" style={{ animationDelay: label ? '100ms' : '0ms' }}>
        {title}
      </h2>
      {description && (
        <p className="font-sans text-editorial-md text-brand-espressoLight/70 max-w-2xl animate-slide-up" style={{ animationDelay: label ? '200ms' : '100ms' }}>
          {description}
        </p>
      )}
    </div>
  );
}