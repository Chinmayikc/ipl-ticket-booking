import { useState } from 'react'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="navbar">
      <nav className="nav-container" aria-label="Main navigation">
        <a className="brand" href="#home" onClick={() => setMenuOpen(false)}>
          IPL <span>2026</span>
        </a>
        <button
          className={`menu-toggle ${menuOpen ? 'is-open' : ''}`}
          type="button"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <ul className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
          <li><a href="#matches" onClick={() => setMenuOpen(false)}>Matches</a></li>
          <li><a href="#booking" onClick={() => setMenuOpen(false)}>Book Ticket</a></li>
          <li><a href="#guidelines" onClick={() => setMenuOpen(false)}>Guidelines</a></li>
        </ul>
      </nav>
    </header>
  )
}

export default Navbar
