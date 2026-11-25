function showToast(message) {
  let toast = document.querySelector('#toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

function scrollToElement(target) {
  if (!target) return;
  const header = document.querySelector('header');
  const headerOffset = (header?.getBoundingClientRect().height || 0) + 16;
  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset);
  window.scrollTo({ top, behavior: 'smooth' });
}

const config = window.IPL_SUPABASE_CONFIG || {};
const hasSupabaseConfig = Boolean(config.url && config.publishableKey && !config.url.includes('your-project'));

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.publishableKey,
      Authorization: `Bearer ${config.publishableKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error((await response.text()) || `Supabase request failed (${response.status})`);
  return response.status === 204 ? null : response.json();
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-IN');
}

function createBookingCode() {
  const token = window.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 10)
    || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `IPL-${token.toUpperCase()}`;
}

function renderBookings(bookings) {
  const records = document.querySelector('#booking-records');
  if (!records) return;
  records.innerHTML = '';
  if (!bookings.length) {
    records.innerHTML = '<tr id="empty-bookings"><td class="empty-state" colspan="5">No bookings yet.</td></tr>';
    return;
  }
  bookings.forEach((booking) => {
    const row = document.createElement('tr');
    [
      booking.booking_code || booking.id || `IPL-${Date.now().toString().slice(-6)}`,
      booking.match || booking.matches?.title || 'Selected match',
      booking.stand || '—',
      booking.seats || booking.quantity || 1,
      formatMoney(booking.total_amount ?? booking.total),
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });
    records.appendChild(row);
  });
}

async function loadBookings() {
  if (!document.querySelector('#booking-records')) return;
  if (!hasSupabaseConfig) {
    renderBookings([]);
    showToast('Supabase is not configured. No database bookings can be loaded.');
    return;
  }
  try {
    const bookings = await supabaseRequest('bookings?select=id,booking_code,stand,seats,total_amount,created_at,matches(title)&order=created_at.desc');
    renderBookings(bookings || []);
  } catch (error) {
    showToast(`Supabase could not load bookings: ${error.message}`);
  }
}

async function saveBooking(formData) {
  const matchNumber = Number(formData.match.replace('match-', ''));
  const booking = {
    booking_code: createBookingCode(),
    match: formData.matchLabel,
    stand: formData.standLabel,
    seats: Number(formData.quantity),
    total_amount: Number(formData.totalAmount),
  };

  if (!hasSupabaseConfig) {
    throw new Error('Supabase is not configured. Add supabase-browser-config.js before booking.');
  }

  const matches = await supabaseRequest(`matches?match_number=eq.${matchNumber}&select=id,available_seats`);
  const selectedMatch = matches?.[0];
  if (!selectedMatch) throw new Error('Selected match was not found. Run supabase-schema.sql first.');
  if (selectedMatch.available_seats < booking.seats) throw new Error('Not enough seats are available.');

  const inserted = await supabaseRequest('bookings', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      booking_code: booking.booking_code,
      match_id: selectedMatch.id,
      stand: booking.stand,
      customer_name: formData.name,
      customer_email: formData.email,
      seats: booking.seats,
      total_amount: booking.total_amount,
    }),
  });

  await supabaseRequest(`matches?id=eq.${selectedMatch.id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ available_seats: selectedMatch.available_seats - booking.seats }),
  });
  return { ...booking, id: inserted?.[0]?.id || `IPL-${Date.now().toString().slice(-6)}` };
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

function updateSummary() {
  if (!match || !stand || !quantity || !summaryMatch || !summaryStand || !summaryPrice || !summaryQuantity || !summaryTotal) return;
  const selectedMatch = match.options[match.selectedIndex];
  const selectedStand = stand.options[stand.selectedIndex];
  const basePrice = Number(selectedMatch?.dataset.price || 0);
  const multiplier = selectedStand?.dataset.multiplier === undefined ? 1 : Number(selectedStand.dataset.multiplier);
  const ticketPrice = Math.round(basePrice * multiplier);
  const count = Number(quantity.value) || 0;
  summaryMatch.textContent = selectedMatch?.dataset.label || match.value || 'Not selected';
  summaryStand.textContent = selectedStand?.dataset.label || stand.value || 'Not selected';
  summaryPrice.textContent = formatMoney(ticketPrice);
  summaryQuantity.textContent = count;
  summaryTotal.textContent = formatMoney(ticketPrice * count);
}

filter?.addEventListener('change', () => {
  matchCards.forEach((card) => { card.hidden = filter.value !== 'all' && !card.dataset.teams.includes(filter.value); });
});

menuToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  menuToggle.classList.toggle('is-open', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

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

document.querySelectorAll('[data-match]').forEach((button) => button.addEventListener('click', (event) => {
  if (!match) return;
  event.preventDefault();
  match.value = button.dataset.match;
  updateSummary();
  scrollToElement(document.querySelector('#booking-form') || document.querySelector('#booking'));
  showToast(`${button.dataset.match} selected. Complete the form to book.`);
}));

if (match && stand && quantity) {
  [match, stand, quantity].forEach((field) => field.addEventListener('change', updateSummary));
  quantity.addEventListener('input', updateSummary);
  bookingForm?.addEventListener('reset', () => window.requestAnimationFrame(updateSummary));
  updateSummary();
}

bookingForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!bookingForm.reportValidity() || !match?.value) return;
  const submitButton = bookingForm.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  try {
    const selectedMatch = match.options[match.selectedIndex];
    const selectedStand = stand.options[stand.selectedIndex];
    const savedBooking = await saveBooking({
      name: document.querySelector('#name')?.value.trim() || 'Guest',
      email: document.querySelector('#email')?.value.trim() || 'guest@example.com',
      match: match.value,
      matchLabel: selectedMatch.dataset.label || match.value,
      standLabel: selectedStand.dataset.label || stand.value,
      quantity: quantity.value,
      totalAmount: summaryTotal.textContent.replace(/,/g, ''),
    });
    if (bookingRecords) {
      await loadBookings();
      bookingForm.reset();
      updateSummary();
      scrollToElement(document.querySelector('#bookings'));
      showToast('Booking confirmed successfully.');
    } else {
      window.location.href = 'index.html#bookings';
    }
  } catch (error) {
    showToast(`Booking failed: ${error.message}`);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

loadBookings();
