export function Table({
  headers,
  children,
  caption,
  className = '',
}: {
  headers: string[];
  children: React.ReactNode;
  caption?: string;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <p className="mb-2 text-xs text-slate-500 sm:hidden">Таблицу можно прокрутить по горизонтали.</p>
      <table className="w-full text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b text-slate-500">
            {headers.map((h) => (
              <th key={h} scope="col" className="p-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

