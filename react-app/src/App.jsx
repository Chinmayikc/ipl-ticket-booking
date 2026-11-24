import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import MatchCard from './components/MatchCard'
import { supabase } from './supabase'

const fallbackTeams = ['All teams', 'CSK', 'MI', 'RCB', 'KKR']

function App() {
  const [matches, setMatches] = useState([])
  const [team, setTeam] = useState('All teams')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', seats: 1 })
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [message, setMessage] = useState(null)

  const fetchMatches = async () => {
    const { data, error } = await supabase.from('matches').select('*').order('match_date')
    if (error) {
      setMessage({ type: 'error', text: `Could not load matches: ${error.message}` })
      setLoading(false)
      return
    }
    setMatches(data || [])
    setSelectedMatch((current) => (current ? data.find((match) => match.id === current.id) || null : current))
    setLoading(false)
  }

  useEffect(() => {
    fetchMatches()

    const channel = supabase
      .channel('matches-live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchMatches)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const teams = useMemo(() => {
    const values = matches.flatMap((match) => match.title.split(' vs '))
    return ['All teams', ...new Set(values)]
  }, [matches])

  const filteredMatches = matches.filter(
    (match) => team === 'All teams' || match.title.includes(team),
  )

  const handleBook = (match) => {
    setSelectedMatch(match)
    setForm({ name: '', email: '', seats: 1 })
    setMessage(null)
    document.querySelector('#booking')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedMatch) return

    const seats = Number(form.seats)
    if (!form.name.trim() || !form.email.trim() || seats < 1 || seats > selectedMatch.available_seats) {
      setMessage({ type: 'error', text: 'Enter valid details and choose available seats.' })
      return
    }

    setBooking(true)
    setMessage(null)

    const totalAmount = selectedMatch.prices.reduce((sum, price) => sum + Number(price.amount), 0) * seats
    const { error: bookingError } = await supabase.from('bookings').insert({
      match_id: selectedMatch.id,
      customer_name: form.name.trim(),
      customer_email: form.email.trim(),
      seats,
      total_amount: totalAmount,
    })

    if (bookingError) {
      setMessage({ type: 'error', text: `Booking failed: ${bookingError.message}` })
      setBooking(false)
      return
    }

    const { error: updateError } = await supabase
      .from('matches')
      .update({ available_seats: selectedMatch.available_seats - seats })
      .eq('id', selectedMatch.id)

    if (updateError) {
      setMessage({ type: 'error', text: `Booking saved, but seats could not be updated: ${updateError.message}` })
    } else {
      setMessage({ type: 'success', text: `Booking confirmed for ${seats} seat${seats === 1 ? '' : 's'}!` })
      setForm({ name: '', email: '', seats: 1 })
      await fetchMatches()
    }
    setBooking(false)
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <section className="schedule-section" id="matches">
          <div className="container">
            <h2>Match Schedule</h2>
            <p className="section-intro">Browse upcoming fixtures and reserve your seat.</p>
            <div className="filter-control">
              <label htmlFor="team-filter">Filter by team</label>
              <select id="team-filter" value={team} onChange={(event) => setTeam(event.target.value)}>
                {(teams.length ? teams : fallbackTeams).map((option) => <option key={option}>{option}</option>)}
              </select>
              <span className="live-status"><span className="status-dot" /> Live database</span>
            </div>
            {loading && <p className="state-message">Loading matches from Supabase…</p>}
            {!loading && filteredMatches.length === 0 && <p className="state-message">No matches found.</p>}
            <div className="match-grid">
              {filteredMatches.map((match) => (
                <MatchCard match={match} key={match.id} onBook={handleBook} />
              ))}
            </div>
          </div>
        </section>
        <section id="booking" className="booking-section">
          <div className="container">
            <h2>Ticket Booking</h2>
            <p className="section-intro">Select a match and reserve your stadium seats.</p>
            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="booking-summary">
                <span className="form-label">Selected match</span>
                <strong>{selectedMatch ? selectedMatch.title : 'Choose Book on a match card'}</strong>
                {selectedMatch && <span>{selectedMatch.available_seats} seats available · {selectedMatch.venue}</span>}
              </div>
              <label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label>
              <label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
              <label>Seats<input required min="1" max={selectedMatch?.available_seats || 1} type="number" value={form.seats} onChange={(event) => setForm({ ...form, seats: event.target.value })} /></label>
              <button className="button" type="submit" disabled={booking || !selectedMatch || selectedMatch.available_seats < 1}>
                {booking ? 'Confirming…' : 'Confirm booking'}
              </button>
              {message && <p className={`form-message ${message.type}`} role="status">{message.text}</p>}
            </form>
          </div>
        </section>
        <section id="guidelines">
          <div className="container">
            <h2>Ticket Guidelines</h2>
          </div>
        </section>
      </main>
    </>
  )
}

export default App
