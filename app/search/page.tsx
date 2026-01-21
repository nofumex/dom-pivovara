import { SearchClient } from './SearchClient'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { query?: string }
}) {
  const query = searchParams.query || ''

  return (
    <main>
      <div className="container">
        <SearchClient query={query} />
      </div>
    </main>
  )
}
