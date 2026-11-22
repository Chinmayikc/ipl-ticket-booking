function showToast(message) {
  let toast = document.querySelector('#toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 3000);
}

function scrollToElement(target) {
  if (!target) return;

  const header = document.querySelector('header');
  const headerOffset = (header?.getBoundingClientRect().height || 0) + 16;
  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset);
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  window.scrollTo({ top, behavior });
}

function scrollToBookingForm() {
  const bookingSection = document.querySelector('#booking');
  const bookingForm = document.querySelector('#booking-form');
  scrollToElement(bookingForm || bookingSection);
}

const filter = document.querySelector('#team-filter');
const matchCards = document.querySelectorAll('#schedule-body .match-card');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('#nav-links');
const gridView = document.querySelector('#grid-view');
const listView = document.querySelector('#list-view');
const scheduleBody = document.querySelector('#schedule-body');
const match = document.getElementById('match');
const stand = document.getElementById('stand');
const quantity = document.getElementById('quantity') || document.getElementById('tickets');
const bookingForm = document.querySelector('#booking-form');
const bookingRecords = document.querySelector('#booking-records');
const summaryMatch = document.getElementById('summary-match');
const summaryStand = document.getElementById('summary-stand');
const summaryPrice = document.getElementById('summary-price');
const summaryQuantity = document.getElementById('summary-quantity');
const summaryTotal = document.getElementById('summary-total');

function updateSummary(notify = false) {
  if (
    !match || !stand || !quantity ||
    !summaryMatch || !summaryStand || !summaryPrice ||
    !summaryQuantity || !summaryTotal
  ) return;

  const selectedMatch = match.options[match.selectedIndex];
  const selectedStand = stand.options[stand.selectedIndex];
  const basePrice = Number(selectedMatch.dataset.price || 0);
  const standMultiplier = selectedStand.dataset.multiplier === undefined
    ? 1
    : Number(selectedStand.dataset.multiplier);
  const ticketPrice = Math.round(basePrice * standMultiplier);
  const count = Number(quantity.value) || 0;
  const total = ticketPrice * count;

  summaryMatch.textContent = selectedMatch.dataset.label || match.value || 'Not selected';
  summaryStand.textContent = selectedStand.dataset.label || stand.value || 'Not selected';
  summaryPrice.textContent = ticketPrice.toLocaleString('en-IN');
  summaryQuantity.textContent = count;
  summaryTotal.textContent = total.toLocaleString('en-IN');

  if (notify) {
    showToast('Booking summary updated.');
  }
}

if (filter) {
  filter.addEventListener('change', () => {
    matchCards.forEach((card) => {
      card.hidden = filter.value !== 'all' && !card.dataset.teams.includes(filter.value);
    });
  });
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    menuToggle.classList.toggle('is-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      menuToggle.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function setMatchView(view) {
  if (!scheduleBody || !gridView || !listView) return;

  const isList = view === 'list';
  scheduleBody.classList.toggle('is-list', isList);
  gridView.classList.toggle('is-active', !isList);
  listView.classList.toggle('is-active', isList);
  gridView.setAttribute('aria-pressed', String(!isList));
  listView.setAttribute('aria-pressed', String(isList));
}

gridView?.addEventListener('click', () => setMatchView('grid'));
listView?.addEventListener('click', () => setMatchView('list'));

document.querySelectorAll('[data-match]').forEach((button) => {
  button.addEventListener('click', (event) => {
    if (!match) return;

    event.preventDefault();
    match.value = button.dataset.match;
    updateSummary();
    scrollToBookingForm();
    showToast(`${button.dataset.match} selected. Complete the form to book.`);
  });
});

if (match && stand && quantity) {
  [match, stand, quantity].forEach((field) => {
    field.addEventListener('change', () => updateSummary(true));
  });
  quantity.addEventListener('input', () => updateSummary());
  if (bookingForm) {
    bookingForm.addEventListener('reset', () => {
      window.requestAnimationFrame(() => updateSummary());
    });
  }
  updateSummary();
}

if (bookingForm && bookingRecords && match && stand && quantity) {
  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!bookingForm.reportValidity() || !match.value) return;

    const emptyRow = document.querySelector('#empty-bookings');
    if (emptyRow) emptyRow.remove();

    const row = document.createElement('tr');
    const values = [
      `IPL-${Date.now().toString().slice(-6)}`,
      match.value,
      stand.value,
      quantity.value,
      document.querySelector('#summary-total').textContent
    ];

    values.forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });

    bookingRecords.appendChild(row);
    bookingForm.reset();
    updateSummary();
    scrollToElement(document.querySelector('#bookings'));
    showToast('Booking confirmed successfully.');
  });
}

if (bookingForm && !bookingRecords && match && stand && quantity) {
  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!bookingForm.reportValidity()) return;

    updateSummary();
    showToast('Booking confirmed successfully.');
  });
}
