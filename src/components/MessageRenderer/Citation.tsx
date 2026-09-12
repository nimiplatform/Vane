const Citation = ({
  href,
  children,
  onOpenFile,
}: {
  href: string;
  children: React.ReactNode;
  onOpenFile: (url: string) => void;
}) => {
  return (
    <a
      href={href}
      target="_blank"
      onClick={(event) => {
        if (href.startsWith('file_id://')) {
          event.preventDefault();
          onOpenFile(href);
        }
      }}
      className="bg-light-secondary dark:bg-dark-secondary px-1 rounded ml-1 no-underline text-xs text-black/70 dark:text-white/70 relative"
    >
      {children}
    </a>
  );
};

export default Citation;
