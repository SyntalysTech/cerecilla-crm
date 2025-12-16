interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1 truncate">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">{children}</div>}
    </div>
  );
}
