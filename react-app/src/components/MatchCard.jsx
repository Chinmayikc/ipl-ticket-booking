function MatchCard({ match, onBook }) {
  const formattedDate = new Date(`${match.match_date}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <article className="match-card">
      <div className="match-card-header">
        <span>Match {String(match.match_number).padStart(2, '0')}</span>
        <strong>{formattedDate}</strong>
      </div>
      <h3>{match.title}</h3>
      <p>{match.venue}</p>
      <p className="availability">{match.available_seats} seats available</p>
      <dl className="ticket-prices">
        {match.prices.map((price) => (
          <div key={price.category}>
            <dt>{price.category}</dt>
            <dd>₹{Number(price.amount).toLocaleString('en-IN')}</dd>
          </div>
        ))}
      </dl>
      <button className="button small-button" type="button" disabled={!match.available_seats} onClick={() => onBook(match)}>
        {match.available_seats ? 'Book' : 'Sold out'}
      </button>
    </article>
  )
}

export default MatchCard
