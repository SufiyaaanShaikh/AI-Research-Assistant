import { Paper } from '@/lib/types'

interface ComparisonTableProps {
  papers: Paper[]
}

export function ComparisonTable({ papers }: ComparisonTableProps) {
  if (papers.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <p className="text-muted-foreground">Select papers to compare</p>
      </div>
    )
  }

  const rows = [
    { label: 'Title', accessor: 'title' },
    { label: 'Authors', accessor: 'authors' },
    { label: 'Year', accessor: 'year' },
    { label: 'Citations', accessor: 'citations' },
    { label: 'Keywords', accessor: 'keywords' },
  ]

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.accessor}
                className={`border-b border-border ${
                  index % 2 === 0 ? 'bg-card' : 'bg-secondary/30'
                }`}
              >
                <td className="px-6 py-4 font-medium text-card-foreground min-w-[150px]">
                  {row.label}
                </td>
                {papers.map((paper) => (
                  <td
                    key={`${paper.id}-${row.accessor}`}
                    className="px-6 py-4 text-sm text-card-foreground"
                  >
                    {row.accessor === 'title' && paper.title}
                    {row.accessor === 'authors' && paper.authors.join(', ')}
                    {row.accessor === 'year' && paper.year}
                    {row.accessor === 'citations' && paper.citations.toLocaleString()}
                    {row.accessor === 'keywords' && paper.keywords.join(', ')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
