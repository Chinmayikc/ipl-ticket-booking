import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import MatchCard from './components/MatchCard'

const matches = [
  {
    number: 'Match 01',
    date: '28 Mar 2026',
    title: 'CSK vs MI',
    venue: 'Wankhede Stadium, Mumbai',
    prices: [
      { category: 'General', amount: '1,500' },
      { category: 'Premium', amount: '3,500' },
      { category: 'VIP', amount: '7,500' },
    ],
  },
  {
    number: 'Match 02',
    date: '29 Mar 2026',
    title: 'RCB vs KKR',
    venue: 'M. Chinnaswamy Stadium, Bengaluru',
    prices: [
      { category: 'General', amount: '1,200' },
      { category: 'Premium', amount: '3,000' },
      { category: 'VIP', amount: '6,500' },
    ],
  },
  {
    number: 'Match 03',
    date: '01 Apr 2026',
    title: 'MI vs KKR',
    venue: 'Eden Gardens, Kolkata',
    prices: [
      { category: 'General', amount: '1,000' },
      { category: 'Premium', amount: '2,800' },
      { category: 'VIP', amount: '6,000' },
    ],
  },
]

function App() {
  const [team, setTeam] = useState('All teams')

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
              <select
                id="team-filter"
                value={team}
                onChange={(event) => setTeam(event.target.value)}
              >
                <option>All teams</option>
                <option>CSK</option>
                <option>MI</option>
                <option>RCB</option>
                <option>KKR</option>
              </select>
            </div>
            <div className="match-grid">
              {matches
                .filter((match) => team === 'All teams' || match.title.includes(team))
                .map((match) => (
                  <MatchCard match={match} key={match.number} />
                ))}
            </div>
          </div>
        </section>
        <section id="booking">
          <div className="container">
            <h2>Ticket Booking</h2>
            <p className="section-intro">Select a match and reserve your stadium seats.</p>
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
