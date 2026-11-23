function MatchCard({ match }) {
  return (
    <article className="match-card">
      <div className="match-card-header">
        <span>{match.number}</span>
        <strong>{match.date}</strong>
      </div>
      <h3>{match.title}</h3>
      <p>{match.venue}</p>
      <dl className="ticket-prices">
        {match.prices.map((price) => (
          <div key={price.category}>
            <dt>{price.category}</dt>
            <dd>{price.amount}</dd>
          </div>
        ))}
      </dl>
      <a className="button small-button" href="#booking">Book</a>
    </article>
  )
}

export default MatchCard
