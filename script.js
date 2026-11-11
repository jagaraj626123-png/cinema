// CineBook demo: all data stays in this browser using localStorage.
const posterImages = {
  dune: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80",
  perfectDays: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80",
  spiderVerse: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80",
  grandBudapest: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=800&q=80",
  pastLives: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80",
  oppenheimer: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80",
  poorThings: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80",
  spiritedAway: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800&q=80"
};

const starterMovies = [
  { id: "m-dune", title: "Dune: Part Two", genre: "Sci-Fi", duration: 166, language: "English", rating: 8.8, price: 16, poster: posterImages.dune },
  { id: "m-perfect-days", title: "Perfect Days", genre: "Drama", duration: 124, language: "Japanese", rating: 8.1, price: 13, poster: posterImages.perfectDays },
  { id: "m-spider-verse", title: "Across the Spider-Verse", genre: "Animation", duration: 140, language: "English", rating: 8.7, price: 15, poster: posterImages.spiderVerse },
  { id: "m-grand-budapest", title: "The Grand Budapest", genre: "Comedy", duration: 99, language: "English", rating: 8.1, price: 12, poster: posterImages.grandBudapest },
  { id: "m-past-lives", title: "Past Lives", genre: "Romance", duration: 106, language: "Korean", rating: 8.0, price: 14, poster: posterImages.pastLives },
  { id: "m-oppenheimer", title: "Oppenheimer", genre: "Drama", duration: 180, language: "English", rating: 8.9, price: 17, poster: posterImages.oppenheimer },
  { id: "m-poor-things", title: "Poor Things", genre: "Fantasy", duration: 141, language: "English", rating: 7.9, price: 15, poster: posterImages.poorThings },
  { id: "m-spirited-away", title: "Spirited Away", genre: "Animation", duration: 125, language: "Japanese", rating: 9.3, price: 12, poster: posterImages.spiritedAway }
];
const storageKeys = { movies: "cinebook-movies", bookings: "cinebook-bookings" };
const loadFromStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error(`Could not read CineBook data (${key}).`, error);
    return fallback;
  }
};
let movies = loadFromStorage(storageKeys.movies, starterMovies);
let bookings = loadFromStorage(storageKeys.bookings, []);
let selectedMovie = null;
let selectedSeats = [];
let currentBooking = null;
let activeView = "discover";

const movieGrid = document.getElementById("movieGrid");
const bookingDialog = document.getElementById("bookingDialog");
const bookingForm = document.getElementById("bookingForm");
const bookingPanel = document.getElementById("bookingPanel");
const confirmationState = document.getElementById("confirmationState");
const filterInputs = ["searchInput", "genreFilter", "languageFilter", "sortFilter"].map((id) => document.getElementById(id));
const money = (amount) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const safeImage = (url) => {
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol) ? escapeHtml(parsed.href) : "";
  } catch {
    return "";
  }
};
function saveData() {
  try {
    localStorage.setItem(storageKeys.movies, JSON.stringify(movies));
    localStorage.setItem(storageKeys.bookings, JSON.stringify(bookings));
  } catch (error) {
    console.error("Could not save CineBook data to this browser.", error);
    showAdminMessage("Could not save changes. Check your browser storage settings.", true);
  }
}
function showAdminMessage(message, isError = false) {
  const target = document.getElementById("adminMessage");
  if (target) {
    target.textContent = message;
    target.style.color = isError ? "#f28b8b" : "#80d2a9";
  }
}
function refreshFilterOptions() {
  const genres = [...new Set(movies.map((movie) => movie.genre).filter(Boolean))].sort();
  const languages = [...new Set(movies.map((movie) => movie.language).filter(Boolean))].sort();
  const genreFilter = document.getElementById("genreFilter");
  const languageFilter = document.getElementById("languageFilter");
  const oldGenre = genreFilter.value;
  const oldLanguage = languageFilter.value;
  genreFilter.innerHTML = '<option value="">All genres</option>' + genres.map((genre) => `<option value="${escapeHtml(genre)}">${escapeHtml(genre)}</option>`).join("");
  languageFilter.innerHTML = '<option value="">All languages</option>' + languages.map((language) => `<option value="${escapeHtml(language)}">${escapeHtml(language)}</option>`).join("");
  genreFilter.value = genres.includes(oldGenre) ? oldGenre : "";
  languageFilter.value = languages.includes(oldLanguage) ? oldLanguage : "";
}
function getFilteredMovies() {
  const term = document.getElementById("searchInput").value.trim().toLowerCase();
  const genre = document.getElementById("genreFilter").value;
  const language = document.getElementById("languageFilter").value;
  const sort = document.getElementById("sortFilter").value;
  const filtered = movies.filter((movie) =>
    movie.title.toLowerCase().includes(term) &&
    (!genre || movie.genre === genre) &&
    (!language || movie.language === language)
  );
  if (sort === "rating") filtered.sort((a, b) => b.rating - a.rating);
  if (sort === "price-low") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price-high") filtered.sort((a, b) => b.price - a.price);
  return filtered;
}
function renderMovies() {
  const visible = getFilteredMovies();
  document.getElementById("resultsCount").textContent = `${visible.length} ${visible.length === 1 ? "film" : "films"} to choose from`;
  document.getElementById("emptyState").hidden = visible.length !== 0;
  movieGrid.hidden = visible.length === 0;
  movieGrid.innerHTML = visible.map((movie, index) => `
    <article class="movie-card" style="animation-delay:${Math.min(index * 45, 250)}ms">
      <div class="poster-wrap">
        <img class="poster" src="${safeImage(movie.poster)}" alt="${escapeHtml(movie.title)} movie poster" loading="lazy" onerror="this.onerror=null;this.style.visibility='hidden'">
        <span class="rating-badge"><span>★</span>${Number(movie.rating).toFixed(1)}</span>
      </div>
      <div class="movie-info">
        <div class="movie-title-row"><h3 class="movie-title" title="${escapeHtml(movie.title)}">${escapeHtml(movie.title)}</h3><span class="movie-price">${money(Number(movie.price))}</span></div>
        <p class="movie-meta"><span>${escapeHtml(movie.genre)}</span><span>${Number(movie.duration)} min</span><span>${escapeHtml(movie.language)}</span></p>
        <div class="movie-actions"><button class="button details-button" data-action="details" data-id="${escapeHtml(movie.id)}">View details</button><button class="button book-button" data-action="book" data-id="${escapeHtml(movie.id)}">Book tickets</button></div>
      </div>
    </article>`).join("");
}
function navigateTo(view) {
  activeView = view;
  const sections = { discover: document.getElementById("discover"), bookings: document.getElementById("bookings"), admin: document.getElementById("admin") };
  Object.entries(sections).forEach(([key, section]) => {
    section.hidden = key !== view;
  });
  document.getElementById("movies").hidden = view !== "discover";
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.view === view));
  document.getElementById("mainNav").classList.remove("open");
  document.getElementById("menuToggle").setAttribute("aria-expanded", "false");
  if (view === "bookings") renderBookings();
  if (view === "admin") renderAdmin();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function openBooking(movie, detailsOnly = false) {
  selectedMovie = movie;
  selectedSeats = [];
  currentBooking = null;
  bookingForm.reset();
  bookingPanel.hidden = false;
  confirmationState.hidden = true;
  document.getElementById("dialogEyebrow").textContent = detailsOnly ? "A LITTLE MORE ABOUT THE FILM" : "MAKE IT A MOVIE NIGHT";
  document.getElementById("dialogTitle").textContent = detailsOnly ? movie.title : "Book your seats";
  document.getElementById("bookingMovieSummary").innerHTML = `
    <img class="summary-poster" src="${safeImage(movie.poster)}" alt="" onerror="this.onerror=null;this.style.visibility='hidden'">
    <div><p class="summary-title">${escapeHtml(movie.title)}</p><p class="summary-meta">${escapeHtml(movie.genre)} · ${movie.duration} min · ${escapeHtml(movie.language)} · ★ ${Number(movie.rating).toFixed(1)} · ${money(Number(movie.price))} / ticket</p></div>`;
  const dateInput = document.getElementById("dateSelect");
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateInput.min = localToday;
  dateInput.value = localToday;
  renderSeats();
  updateCheckout();
  document.getElementById("bookingForm").querySelectorAll("input, select, button[type=submit]").forEach((control) => {
    control.disabled = detailsOnly;
  });
  document.getElementById("bookingForm").hidden = detailsOnly;
  bookingDialog.showModal();
}
function getBookedSeats() {
  const seed = `${selectedMovie.id}-${document.getElementById("dateSelect").value}-${document.getElementById("timeSelect").value}-${document.getElementById("theatreSelect").value}`;
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const demoSeats = [3, 11, 18, 26, 39, 47].filter((_, index) => ((hash >> index) & 1) === 1);
  const reservationSeats = bookings
    .filter((booking) => booking.status === "confirmed" && booking.date === document.getElementById("dateSelect").value &&
      booking.time === document.getElementById("timeSelect").value && booking.theatre === document.getElementById("theatreSelect").value)
    .flatMap((booking) => booking.seats);
  const bookedIndices = reservationSeats.map((seat) => (seat.charCodeAt(0) - 65) * 8 + Number(seat.slice(1)) - 1);
  return [...new Set([...demoSeats, ...bookedIndices])];
}
function renderSeats() {
  if (!selectedMovie) return;
  const booked = getBookedSeats();
  document.getElementById("seatLayout").innerHTML = Array.from({ length: 48 }, (_, index) => {
    const label = `${String.fromCharCode(65 + Math.floor(index / 8))}${index % 8 + 1}`;
    const isBooked = booked.includes(index);
    const isSelected = selectedSeats.includes(label);
    const aisleClass = index % 8 === 4 ? "seat-aisle" : "";
    return `<button type="button" class="seat ${aisleClass} ${isBooked ? "booked" : ""} ${isSelected ? "selected" : ""}" data-seat="${label}" aria-label="Seat ${label}${isBooked ? ", booked" : isSelected ? ", selected" : ", available"}" aria-pressed="${isSelected}" ${isBooked ? "disabled" : ""}>${index % 8 + 1}</button>`;
  }).join("");
}
function updateCheckout() {
  const count = selectedSeats.length;
  document.getElementById("selectedSeatText").textContent = count ? selectedSeats.join(", ") : "No seats";
  document.getElementById("bookingTotal").textContent = money(count * (Number(selectedMovie?.price) || 0));
  document.getElementById("confirmBooking").disabled = count === 0;
}
function createBookingId() {
  return `CB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
function confirmBooking(event) {
  event.preventDefault();
  if (!bookingForm.reportValidity() || !selectedSeats.length || !selectedMovie) return;
  const booking = {
    id: createBookingId(),
    movieId: selectedMovie.id,
    movieTitle: selectedMovie.title,
    poster: selectedMovie.poster,
    theatre: document.getElementById("theatreSelect").value,
    date: document.getElementById("dateSelect").value,
    time: document.getElementById("timeSelect").value,
    seats: [...selectedSeats],
    name: document.getElementById("guestName").value.trim(),
    email: document.getElementById("guestEmail").value.trim(),
    total: selectedSeats.length * Number(selectedMovie.price),
    status: "confirmed",
    createdAt: new Date().toISOString()
  };
  bookings.unshift(booking);
  currentBooking = booking;
  saveData();
  bookingPanel.hidden = true;
  confirmationState.hidden = false;
  confirmationState.innerHTML = `
    <div class="success-icon">✓</div><h3>You're on the list.</h3><p>Your movie night is booked. We can't wait to see you.</p>
    <div class="confirmation-ticket"><p><strong>${escapeHtml(booking.movieTitle)}</strong></p><p>${escapeHtml(booking.theatre)}</p><p>${escapeHtml(formatDate(booking.date))} · ${escapeHtml(booking.time)}</p><p>Seats: <strong>${escapeHtml(booking.seats.join(", "))}</strong></p><p>Total: <strong>${money(booking.total)}</strong></p><p>Booking ID: <strong>${escapeHtml(booking.id)}</strong></p></div>
    <button class="button button-primary" id="confirmationDone">Lovely, thanks <span aria-hidden="true">→</span></button>
    <button class="button button-ghost" id="confirmationViewBookings">View my tickets</button>`;
  document.getElementById("confirmationDone").addEventListener("click", () => bookingDialog.close());
  document.getElementById("confirmationViewBookings").addEventListener("click", () => { bookingDialog.close(); navigateTo("bookings"); });
}
function formatDate(date) {
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}
function renderBookings() {
  const list = document.getElementById("bookingList");
  const confirmed = bookings.filter((booking) => booking.status === "confirmed");
  document.getElementById("bookingsEmpty").hidden = confirmed.length > 0;
  list.hidden = confirmed.length === 0;
  list.innerHTML = confirmed.map((booking) => `
    <article class="booking-card">
      <img class="booking-card-poster" src="${safeImage(booking.poster)}" alt="${escapeHtml(booking.movieTitle)} poster" onerror="this.onerror=null;this.style.visibility='hidden'">
      <div class="booking-card-content"><h3>${escapeHtml(booking.movieTitle)}</h3><div class="booking-details"><span><strong>Theatre</strong> · ${escapeHtml(booking.theatre)}</span><span><strong>Date</strong> · ${escapeHtml(formatDate(booking.date))}</span><span><strong>Time</strong> · ${escapeHtml(booking.time)}</span><span><strong>Seats</strong> · ${escapeHtml(booking.seats.join(", "))}</span><span><strong>Total</strong> · ${money(Number(booking.total))}</span></div><div class="booking-code">BOOKING ID · <strong>${escapeHtml(booking.id)}</strong></div></div>
      <div class="booking-card-actions"><button class="button button-outline" data-print="${escapeHtml(booking.id)}">Print ticket</button><button class="button cancel-button" data-cancel="${escapeHtml(booking.id)}">Cancel demo ticket</button></div>
    </article>`).join("");
}
function printTicket(id) {
  const booking = bookings.find((ticket) => ticket.id === id);
  if (!booking) return;
  const printWindow = window.open("", "_blank", "width=600,height=700");
  if (!printWindow) {
    window.alert("Your browser blocked the print window. Please allow pop-ups for this page and try again.");
    return;
  }
  printWindow.document.write(`<!doctype html><html><head><title>CineBook ticket ${escapeHtml(booking.id)}</title><style>body{font:16px Arial,sans-serif;color:#222;max-width:560px;margin:40px auto;padding:25px;border:1px dashed #aaa}h1{color:#e94242}p{padding:8px 0;border-bottom:1px solid #eee}strong{color:#111}</style></head><body><h1>CineBook</h1><h2>${escapeHtml(booking.movieTitle)}</h2><p><strong>Theatre:</strong> ${escapeHtml(booking.theatre)}</p><p><strong>Date:</strong> ${escapeHtml(formatDate(booking.date))}</p><p><strong>Showtime:</strong> ${escapeHtml(booking.time)}</p><p><strong>Seats:</strong> ${escapeHtml(booking.seats.join(", "))}</p><p><strong>Total:</strong> ${money(Number(booking.total))}</p><p><strong>Booking ID:</strong> ${escapeHtml(booking.id)}</p><script>window.onload=()=>window.print()<\/script></body></html>`);
  printWindow.document.close();
}
function renderAdmin() {
  const list = document.getElementById("adminMovieList");
  document.getElementById("adminMovieCount").textContent = `${movies.length} movies`;
  list.innerHTML = movies.map((movie) => `<div class="admin-movie-row"><img src="${safeImage(movie.poster)}" alt="" onerror="this.onerror=null;this.style.visibility='hidden'"><div><strong title="${escapeHtml(movie.title)}">${escapeHtml(movie.title)}</strong><small>${escapeHtml(movie.genre)} · ★ ${Number(movie.rating).toFixed(1)} · ${money(Number(movie.price))}</small></div><button type="button" data-edit-movie="${escapeHtml(movie.id)}">Edit</button><button type="button" data-delete-movie="${escapeHtml(movie.id)}">Delete</button></div>`).join("");
  document.getElementById("adminBookingCount").textContent = `${bookings.length} records`;
  document.getElementById("adminBookingsEmpty").hidden = bookings.length > 0;
  document.getElementById("adminBookingRows").innerHTML = bookings.map((booking) => `<tr><td>${escapeHtml(booking.id)}</td><td>${escapeHtml(booking.name)}</td><td>${escapeHtml(booking.movieTitle)}</td><td>${escapeHtml(formatDate(booking.date))} · ${escapeHtml(booking.time)}</td><td>${escapeHtml(booking.seats.join(", "))}</td><td>${money(Number(booking.total))}</td><td class="status-${escapeHtml(booking.status)}">${escapeHtml(booking.status)}</td></tr>`).join("");
}
function resetMovieForm() {
  document.getElementById("movieForm").reset();
  document.getElementById("editMovieId").value = "";
  document.getElementById("adminFormTitle").textContent = "Add a movie";
  document.getElementById("adminSubmit").innerHTML = 'Add movie <span aria-hidden="true">＋</span>';
  document.getElementById("cancelEdit").hidden = true;
}
function editMovie(id) {
  const movie = movies.find((item) => item.id === id);
  if (!movie) return;
  document.getElementById("editMovieId").value = movie.id;
  document.getElementById("adminTitle").value = movie.title;
  document.getElementById("adminGenre").value = movie.genre;
  document.getElementById("adminLanguage").value = movie.language;
  document.getElementById("adminDuration").value = movie.duration;
  document.getElementById("adminRating").value = movie.rating;
  document.getElementById("adminPrice").value = movie.price;
  document.getElementById("adminPoster").value = movie.poster;
  document.getElementById("adminFormTitle").textContent = "Edit movie";
  document.getElementById("adminSubmit").innerHTML = 'Save changes <span aria-hidden="true">✓</span>';
  document.getElementById("cancelEdit").hidden = false;
  document.getElementById("movieForm").scrollIntoView({ behavior: "smooth", block: "start" });
}
function handleMovieSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const editId = document.getElementById("editMovieId").value;
  const movie = {
    id: editId || `m-${Date.now().toString(36)}`,
    title: document.getElementById("adminTitle").value.trim(),
    genre: document.getElementById("adminGenre").value.trim(),
    language: document.getElementById("adminLanguage").value.trim(),
    duration: Number(document.getElementById("adminDuration").value),
    rating: Number(document.getElementById("adminRating").value),
    price: Number(document.getElementById("adminPrice").value),
    poster: document.getElementById("adminPoster").value.trim()
  };
  if (editId) {
    movies = movies.map((item) => item.id === editId ? movie : item);
    bookings = bookings.map((booking) => booking.movieId === editId ? { ...booking, movieTitle: movie.title, poster: movie.poster } : booking);
    showAdminMessage("Movie updated.");
  } else {
    movies.push(movie);
    showAdminMessage("Movie added.");
  }
  saveData();
  resetMovieForm();
  refreshFilterOptions();
  renderMovies();
  renderAdmin();
}

document.querySelectorAll("[data-view]").forEach((control) => control.addEventListener("click", (event) => {
  event.preventDefault();
  navigateTo(control.dataset.view);
}));
document.getElementById("menuToggle").addEventListener("click", (event) => {
  const menu = document.getElementById("mainNav");
  const isOpen = menu.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(isOpen));
});
filterInputs.forEach((input) => input.addEventListener(input.id === "searchInput" ? "input" : "change", renderMovies));
document.getElementById("clearFilters").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  document.getElementById("genreFilter").value = "";
  document.getElementById("languageFilter").value = "";
  document.getElementById("sortFilter").value = "featured";
  renderMovies();
});
movieGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const movie = movies.find((item) => item.id === button.dataset.id);
  if (movie) openBooking(movie, button.dataset.action === "details");
});
document.getElementById("closeDialog").addEventListener("click", () => bookingDialog.close());
bookingDialog.addEventListener("click", (event) => {
  if (event.target === bookingDialog) bookingDialog.close();
});
document.getElementById("seatLayout").addEventListener("click", (event) => {
  const seat = event.target.closest("[data-seat]");
  if (!seat || seat.disabled) return;
  const label = seat.dataset.seat;
  selectedSeats = selectedSeats.includes(label) ? selectedSeats.filter((item) => item !== label) : [...selectedSeats, label];
  renderSeats();
  updateCheckout();
});
["theatreSelect", "dateSelect", "timeSelect"].forEach((id) => document.getElementById(id).addEventListener("change", () => {
  selectedSeats = [];
  renderSeats();
  updateCheckout();
}));
bookingForm.addEventListener("submit", confirmBooking);
document.getElementById("bookingList").addEventListener("click", (event) => {
  const printButton = event.target.closest("[data-print]");
  if (printButton) printTicket(printButton.dataset.print);
  const cancelButton = event.target.closest("[data-cancel]");
  if (cancelButton && window.confirm("Cancel this demo ticket?")) {
    bookings = bookings.map((booking) => booking.id === cancelButton.dataset.cancel ? { ...booking, status: "cancelled" } : booking);
    saveData();
    renderBookings();
  }
});
document.getElementById("movieForm").addEventListener("submit", handleMovieSubmit);
document.getElementById("cancelEdit").addEventListener("click", resetMovieForm);
document.getElementById("adminMovieList").addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-movie]");
  if (editButton) editMovie(editButton.dataset.editMovie);
  const deleteButton = event.target.closest("[data-delete-movie]");
  if (deleteButton && window.confirm("Delete this movie from the demo catalogue? Existing booking records will remain.")) {
    movies = movies.filter((movie) => movie.id !== deleteButton.dataset.deleteMovie);
    saveData();
    refreshFilterOptions();
    renderMovies();
    renderAdmin();
    showAdminMessage("Movie deleted.");
  }
});
const infoCopy = {
  "About Us": "CineBook is a little home for big-screen stories. Browse the lineup, pick your seats, and make a night of it.",
  "Contact": "For this front-end demo, there is no connected customer-support inbox. Your demo bookings stay in this browser.",
  "Help": "Choose a movie, select a theatre, date, showtime, and seats, then enter your name and email to create a demo ticket.",
  "Terms and Conditions": "CineBook here is a front-end demo. Bookings are stored only in this browser; there are no real tickets or payments.",
  "Privacy Policy": "This demo keeps movie and booking data in your browser's local storage. It does not send the information to a server."
};
document.querySelectorAll("[data-info]").forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  document.getElementById("infoTitle").textContent = link.dataset.info;
  document.getElementById("infoCopy").textContent = infoCopy[link.dataset.info];
  document.getElementById("infoDialog").showModal();
}));
document.getElementById("closeInfo").addEventListener("click", () => document.getElementById("infoDialog").close());
document.getElementById("infoDialog").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
document.getElementById("currentYear").textContent = new Date().getFullYear();
refreshFilterOptions();
renderMovies();
