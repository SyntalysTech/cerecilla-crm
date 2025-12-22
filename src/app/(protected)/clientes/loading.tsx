export default function ClientesLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-gray-200 rounded" />
          <div className="h-10 w-24 bg-gray-200 rounded" />
          <div className="h-10 w-24 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Search and filters skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 mb-4">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 h-10 bg-gray-200 rounded" />
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-8 w-20 bg-gray-200 rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <th key={i} className="px-4 py-3">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
                <tr key={row} className="border-t border-gray-100">
                  {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                    <td key={col} className="px-4 py-3">
                      <div
                        className="h-4 bg-gray-200 rounded"
                        style={{ width: `${Math.random() * 40 + 60}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
