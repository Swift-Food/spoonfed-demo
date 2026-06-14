import type { ReactNode } from 'react';

interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}

export default function Table<T>({ columns, rows, rowKey }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-eden-sage/40 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-eden-sand text-eden-stone">
          <tr>
            {columns.map((col) => (
              <th key={col.header} className={`px-4 py-2 font-semibold ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t border-eden-sage/30 even:bg-eden-sand/40">
              {columns.map((col) => (
                <td key={col.header} className={`px-4 py-2 ${col.className ?? ''}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
