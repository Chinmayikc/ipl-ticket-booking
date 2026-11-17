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
const rows = document.querySelectorAll('#schedule-body tr');
const match = document.querySelector('#match');
const stand = document.querySelector('#stand');
const quantity = document.querySelector('#quantity');
const bookingForm = document.querySelector('#booking-form');
const bookingRecords = document.querySelector('#booking-records');

function updateSummary() {
  if (!match || !stand || !quantity) return;

  const selectedMatch = match.options[match.selectedIndex];
  const selectedStand = stand.options[stand.selectedIndex];
  const basePrice = Number(selectedMatch.dataset.price || 0);
  const ticketPrice = Math.round(basePrice * Number(selectedStand.dataset.multiplier || 1));
  const count = Number(quantity.value) || 0;

  document.querySelector('#summary-match').textContent = match.value || 'Not selected';
  document.querySelector('#summary-stand').textContent = stand.value;
  document.querySelector('#summary-price').textContent = ticketPrice.toLocaleString('en-IN');
  document.querySelector('#summary-quantity').textContent = count;
  document.querySelector('#summary-total').textContent = (ticketPrice * count).toLocaleString('en-IN');
}

if (filter) {
  filter.addEventListener('change', () => {
    rows.forEach((row) => {
      row.hidden = filter.value !== 'all' && !row.dataset.teams.includes(filter.value);
    });
  });
}

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
  [match, stand, quantity].forEach((field) => field.addEventListener('input', updateSummary));
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
