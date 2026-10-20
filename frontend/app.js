const services = [
  {
    id: "cleaning",
    name: "Cleaning and exam",
    duration: 45,
    price: "$95",
    description: "Preventive hygiene visit with oral exam.",
  },
  {
    id: "whitening",
    name: "Whitening consult",
    duration: 30,
    price: "$65",
    description: "Shade review and treatment planning.",
  },
  {
    id: "filling",
    name: "Composite filling",
    duration: 60,
    price: "$180",
    description: "Restorative care for small to medium cavities.",
  },
  {
    id: "emergency",
    name: "Emergency visit",
    duration: 30,
    price: "$120",
    description: "Pain, swelling, broken tooth, or urgent concern.",
  },
  {
    id: "implant",
    name: "Implant consult",
    duration: 60,
    price: "$150",
    description: "Surgical assessment and digital treatment plan.",
  },
];

const providers = [
  { id: "dr-amani", name: "Dr. Lina Amani", role: "General dentist" },
  { id: "dr-hale", name: "Dr. Noah Hale", role: "Restorative dentist" },
  { id: "hyg-maya", name: "Maya Chen", role: "Dental hygienist" },
];

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  complete: "Complete",
  cancelled: "Cancelled",
};

const statusOrder = ["pending", "confirmed", "checked_in", "complete", "cancelled"];
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const scheduleDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const storageKeys = {
  appointments: "pearlDental.appointments",
  schedule: "pearlDental.schedule",
};

const defaultSchedule = {
  Monday: { enabled: true, open: "08:30", close: "17:00", breakStart: "12:30", breakEnd: "13:30" },
  Tuesday: { enabled: true, open: "08:30", close: "17:00", breakStart: "12:30", breakEnd: "13:30" },
  Wednesday: { enabled: true, open: "09:00", close: "18:00", breakStart: "13:00", breakEnd: "14:00" },
  Thursday: { enabled: true, open: "08:30", close: "17:00", breakStart: "12:30", breakEnd: "13:30" },
  Friday: { enabled: true, open: "08:30", close: "16:00", breakStart: "12:30", breakEnd: "13:30" },
  Saturday: { enabled: true, open: "09:00", close: "13:00", breakStart: "00:00", breakEnd: "00:00" },
  Sunday: { enabled: false, open: "09:00", close: "13:00", breakStart: "00:00", breakEnd: "00:00" },
};

const dom = {
  navButtons: document.querySelectorAll(".nav-button"),
  views: document.querySelectorAll(".view"),
  serviceSelect: document.querySelector("#service-select"),
  providerSelect: document.querySelector("#provider-select"),
  appointmentDate: document.querySelector("#appointment-date"),
  bookingForm: document.querySelector("#booking-form"),
  slotList: document.querySelector("#slot-list"),
  slotCount: document.querySelector("#slot-count"),
  slotSummary: document.querySelector("#selected-slot-summary"),
  appointmentList: document.querySelector("#appointment-list"),
  statusFilter: document.querySelector("#status-filter"),
  patientSearch: document.querySelector("#patient-search"),
  patientTableBody: document.querySelector("#patient-table-body"),
  scheduleForm: document.querySelector("#schedule-form"),
  scheduleGrid: document.querySelector("#schedule-grid"),
  resetSchedule: document.querySelector("#reset-schedule"),
  resetDemo: document.querySelector("#reset-demo"),
  jumpBooking: document.querySelector("#jump-booking"),
  toast: document.querySelector("#toast"),
  metricToday: document.querySelector("#metric-today"),
  metricPending: document.querySelector("#metric-pending"),
  metricConfirmed: document.querySelector("#metric-confirmed"),
  metricPatients: document.querySelector("#metric-patients"),
  sidebarSlotCount: document.querySelector("#sidebar-slot-count"),
};

let state = {
  appointments: loadJson(storageKeys.appointments, createSeedAppointments()),
  schedule: loadJson(storageKeys.schedule, defaultSchedule),
  selectedSlot: "",
  filterStatus: "all",
  patientSearch: "",
};

function createSeedAppointments() {
  return [
    {
      id: createId(),
      patientName: "Mina Roberts",
      phone: "(555) 010-3822",
      email: "mina.roberts@example.com",
      serviceId: "cleaning",
      providerId: "hyg-maya",
      date: toIsoDate(0),
      time: "09:00",
      status: "confirmed",
      notes: "Routine six-month cleaning.",
      createdAt: new Date().toISOString(),
    },
    {
      id: createId(),
      patientName: "Adam Perez",
      phone: "(555) 013-4408",
      email: "adam.perez@example.com",
      serviceId: "emergency",
      providerId: "dr-amani",
      date: toIsoDate(0),
      time: "11:30",
      status: "pending",
      notes: "Sharp pain on lower molar.",
      createdAt: new Date().toISOString(),
    },
    {
      id: createId(),
      patientName: "Sofia Lane",
      phone: "(555) 016-9302",
      email: "sofia.lane@example.com",
      serviceId: "implant",
      providerId: "dr-hale",
      date: toIsoDate(1),
      time: "10:00",
      status: "confirmed",
      notes: "Implant consultation and imaging.",
      createdAt: new Date().toISOString(),
    },
  ];
}

function loadJson(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function saveState() {
  localStorage.setItem(storageKeys.appointments, JSON.stringify(state.appointments));
  localStorage.setItem(storageKeys.schedule, JSON.stringify(state.schedule));
}

function toIsoDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createId() {
  return `apt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getService(id) {
  return services.find((service) => service.id === id) || services[0];
}

function getProvider(id) {
  return providers.find((provider) => provider.id === id) || providers[0];
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

function formatDisplayDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function isOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function appointmentDuration(appointment) {
  return getService(appointment.serviceId).duration;
}

function hasConflict({ providerId, date, time, serviceId }, ignoredId = "") {
  const start = timeToMinutes(time);
  const end = start + getService(serviceId).duration;

  return state.appointments.some((appointment) => {
    if (
      appointment.id === ignoredId ||
      appointment.providerId !== providerId ||
      appointment.date !== date ||
      appointment.status === "cancelled"
    ) {
      return false;
    }

    const appointmentStart = timeToMinutes(appointment.time);
    const appointmentEnd = appointmentStart + appointmentDuration(appointment);
    return isOverlap(start, end, appointmentStart, appointmentEnd);
  });
}

function isInsideBreak(start, end, daySchedule) {
  const breakStart = timeToMinutes(daySchedule.breakStart);
  const breakEnd = timeToMinutes(daySchedule.breakEnd);
  return breakEnd > breakStart && isOverlap(start, end, breakStart, breakEnd);
}

function getSlots(date, providerId, serviceId) {
  const dayName = days[new Date(`${date}T00:00:00`).getDay()];
  const daySchedule = state.schedule[dayName];

  if (!daySchedule || !daySchedule.enabled) {
    return [];
  }

  const service = getService(serviceId);
  const open = timeToMinutes(daySchedule.open);
  const close = timeToMinutes(daySchedule.close);
  const slots = [];

  for (let start = open; start + service.duration <= close; start += 30) {
    const end = start + service.duration;
    if (isInsideBreak(start, end, daySchedule)) {
      continue;
    }

    const time = minutesToTime(start);
    slots.push({
      time,
      available: !hasConflict({ providerId, date, time, serviceId }),
    });
  }

  return slots;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function populateOptions() {
  dom.serviceSelect.innerHTML = services
    .map(
      (service) =>
        `<option value="${service.id}">${service.name} - ${service.duration} min - ${service.price}</option>`,
    )
    .join("");

  dom.providerSelect.innerHTML = providers
    .map((provider) => `<option value="${provider.id}">${provider.name} - ${provider.role}</option>`)
    .join("");
}

function renderAll() {
  renderMetrics();
  renderSlots();
  renderAppointments();
  renderPatients();
  renderSchedule();
}

function renderMetrics() {
  const today = toIsoDate(0);
  const activeAppointments = state.appointments.filter((appointment) => appointment.status !== "cancelled");
  const todayCount = activeAppointments.filter((appointment) => appointment.date === today).length;
  const pendingCount = state.appointments.filter((appointment) => appointment.status === "pending").length;
  const confirmedCount = state.appointments.filter((appointment) => appointment.status === "confirmed").length;
  const patientCount = buildPatients().length;
  const openToday = getSlots(today, dom.providerSelect.value || providers[0].id, dom.serviceSelect.value || services[0].id)
    .filter((slot) => slot.available).length;

  dom.metricToday.textContent = todayCount;
  dom.metricPending.textContent = pendingCount;
  dom.metricConfirmed.textContent = confirmedCount;
  dom.metricPatients.textContent = patientCount;
  dom.sidebarSlotCount.textContent = `${openToday} available today`;
}

function renderSlots() {
  const date = dom.appointmentDate.value;
  const providerId = dom.providerSelect.value;
  const serviceId = dom.serviceSelect.value;

  if (!date || !providerId || !serviceId) {
    dom.slotList.innerHTML = '<p class="empty-state">Complete the booking details to see availability.</p>';
    dom.slotCount.textContent = "0 slots";
    return;
  }

  const slots = getSlots(date, providerId, serviceId);
  const availableCount = slots.filter((slot) => slot.available).length;

  dom.slotCount.textContent = `${availableCount} open`;
  dom.slotCount.className = "status-pill neutral";

  if (!slots.length) {
    dom.slotList.innerHTML =
      '<p class="empty-state">No clinic hours are configured for this date.</p>';
    dom.slotSummary.textContent = "Choose another date or update weekly hours.";
    return;
  }

  dom.slotList.innerHTML = slots
    .map((slot) => {
      const selected = state.selectedSlot === slot.time ? " is-selected" : "";
      const booked = slot.available ? "" : " is-booked";
      const disabled = slot.available ? "" : " disabled";
      return `<button class="slot-button${selected}${booked}" type="button" data-time="${slot.time}"${disabled}>${slot.time}</button>`;
    })
    .join("");

  updateSlotSummary();
}

function updateSlotSummary() {
  if (!state.selectedSlot) {
    dom.slotSummary.textContent = "Choose one of the available times.";
    return;
  }

  const service = getService(dom.serviceSelect.value);
  const provider = getProvider(dom.providerSelect.value);
  dom.slotSummary.textContent = `${formatDisplayDate(dom.appointmentDate.value)} at ${state.selectedSlot} with ${provider.name} for ${service.name}.`;
}

function renderAppointments() {
  const filtered = state.appointments
    .filter((appointment) => state.filterStatus === "all" || appointment.status === state.filterStatus)
    .slice()
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  if (!filtered.length) {
    dom.appointmentList.innerHTML = '<p class="empty-state">No appointments match this view.</p>';
    return;
  }

  dom.appointmentList.innerHTML = filtered.map(renderAppointmentCard).join("");
}

function renderAppointmentCard(appointment) {
  const service = getService(appointment.serviceId);
  const provider = getProvider(appointment.providerId);
  const notes = appointment.notes ? escapeHtml(appointment.notes) : "No notes added.";

  return `
    <article class="appointment-card ${appointment.status}">
      <div>
        <span class="status-pill ${appointment.status}">${statusLabels[appointment.status]}</span>
        <h3>${escapeHtml(appointment.patientName)}</h3>
        <p>${escapeHtml(service.name)} with ${escapeHtml(provider.name)}</p>
      </div>
      <div>
        <p><strong>${formatDisplayDate(appointment.date)} at ${appointment.time}</strong></p>
        <p>${escapeHtml(appointment.phone)}<br />${escapeHtml(appointment.email)}</p>
        <p>${notes}</p>
      </div>
      <div class="appointment-actions">
        <label>
          Update status
          <select data-status-id="${appointment.id}">
            ${statusOrder
              .map(
                (status) =>
                  `<option value="${status}"${appointment.status === status ? " selected" : ""}>${statusLabels[status]}</option>`,
              )
              .join("")}
          </select>
        </label>
      </div>
    </article>
  `;
}

function buildPatients() {
  const patientMap = new Map();

  state.appointments.forEach((appointment) => {
    const key = `${appointment.email || appointment.phone}`.toLowerCase();
    const existing = patientMap.get(key) || {
      name: appointment.patientName,
      phone: appointment.phone,
      email: appointment.email,
      visits: [],
    };

    existing.visits.push(appointment);
    existing.visits.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    patientMap.set(key, existing);
  });

  return Array.from(patientMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function renderPatients() {
  const search = state.patientSearch.trim().toLowerCase();
  const patients = buildPatients().filter((patient) => {
    const haystack = `${patient.name} ${patient.phone} ${patient.email}`.toLowerCase();
    return haystack.includes(search);
  });

  if (!patients.length) {
    dom.patientTableBody.innerHTML =
      '<tr><td colspan="5"><p class="empty-state">No patients found.</p></td></tr>';
    return;
  }

  dom.patientTableBody.innerHTML = patients
    .map((patient) => {
      const nextVisit = patient.visits.find((visit) => visit.status !== "cancelled" && visit.date >= toIsoDate(0));
      const lastVisit = patient.visits[patient.visits.length - 1];
      const nextText = nextVisit
        ? `${formatDisplayDate(nextVisit.date)} at ${nextVisit.time}`
        : "No upcoming visit";

      return `
        <tr>
          <td>
            <span class="patient-name">
              <strong>${escapeHtml(patient.name)}</strong>
              <span>${escapeHtml(getService(lastVisit.serviceId).name)}</span>
            </span>
          </td>
          <td class="patient-contact">
            ${escapeHtml(patient.phone)}<br />
            ${escapeHtml(patient.email)}
          </td>
          <td>${patient.visits.length}</td>
          <td>${nextText}</td>
          <td><span class="status-pill ${lastVisit.status}">${statusLabels[lastVisit.status]}</span></td>
        </tr>
      `;
    })
    .join("");
}

function renderSchedule() {
  dom.scheduleGrid.innerHTML = scheduleDays
    .map((day) => {
      const settings = state.schedule[day];
      return `
        <div class="schedule-row${settings.enabled ? "" : " is-closed"}" data-day="${day}">
          <label class="day-toggle">
            <input type="checkbox" data-field="enabled" ${settings.enabled ? "checked" : ""} />
            ${day}
          </label>
          ${timeInput("Open", "open", settings.open)}
          ${timeInput("Close", "close", settings.close)}
          ${timeInput("Break start", "breakStart", settings.breakStart)}
          ${timeInput("Break end", "breakEnd", settings.breakEnd)}
        </div>
      `;
    })
    .join("");
}

function timeInput(label, field, value) {
  return `
    <label>
      ${label}
      <input type="time" data-field="${field}" value="${value}" />
    </label>
  `;
}

function setActiveView(viewId) {
  dom.navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewId);
  });

  dom.views.forEach((view) => {
    view.classList.toggle("is-active", view.id === viewId);
  });
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    dom.toast.classList.remove("is-visible");
  }, 2600);
}

function bindEvents() {
  dom.navButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.view));
  });

  dom.jumpBooking.addEventListener("click", () => setActiveView("booking-view"));

  [dom.serviceSelect, dom.providerSelect, dom.appointmentDate].forEach((element) => {
    element.addEventListener("change", () => {
      state.selectedSlot = "";
      renderSlots();
      renderMetrics();
    });
  });

  dom.slotList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-time]");
    if (!button || button.disabled) {
      return;
    }

    state.selectedSlot = button.dataset.time;
    renderSlots();
  });

  dom.bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!state.selectedSlot) {
      showToast("Select an available time slot first.");
      return;
    }

    const formData = new FormData(dom.bookingForm);
    const appointment = {
      id: createId(),
      patientName: formData.get("patientName").trim(),
      phone: formData.get("phone").trim(),
      email: formData.get("email").trim(),
      serviceId: formData.get("serviceId"),
      providerId: formData.get("providerId"),
      date: formData.get("date"),
      time: state.selectedSlot,
      status: "pending",
      notes: formData.get("notes").trim(),
      createdAt: new Date().toISOString(),
    };

    if (hasConflict(appointment)) {
      state.selectedSlot = "";
      renderSlots();
      showToast("That provider was just booked for this time.");
      return;
    }

    state.appointments.push(appointment);
    saveState();
    state.selectedSlot = "";
    dom.bookingForm.reset();
    setDefaultBookingDate();
    renderAll();
    showToast("Appointment saved as pending.");
  });

  dom.appointmentList.addEventListener("change", (event) => {
    const select = event.target.closest("[data-status-id]");
    if (!select) {
      return;
    }

    const appointment = state.appointments.find((item) => item.id === select.dataset.statusId);
    if (appointment) {
      appointment.status = select.value;
      saveState();
      renderAll();
      showToast("Appointment status updated.");
    }
  });

  dom.statusFilter.addEventListener("change", () => {
    state.filterStatus = dom.statusFilter.value;
    renderAppointments();
  });

  dom.patientSearch.addEventListener("input", () => {
    state.patientSearch = dom.patientSearch.value;
    renderPatients();
  });

  dom.scheduleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const nextSchedule = {};

    dom.scheduleGrid.querySelectorAll(".schedule-row").forEach((row) => {
      const day = row.dataset.day;
      nextSchedule[day] = {};
      row.querySelectorAll("[data-field]").forEach((input) => {
        nextSchedule[day][input.dataset.field] =
          input.type === "checkbox" ? input.checked : input.value;
      });
    });

    state.schedule = nextSchedule;
    saveState();
    state.selectedSlot = "";
    renderAll();
    showToast("Weekly schedule saved.");
  });

  dom.resetSchedule.addEventListener("click", () => {
    state.schedule = structuredClone(defaultSchedule);
    saveState();
    state.selectedSlot = "";
    renderAll();
    showToast("Weekly hours restored.");
  });

  dom.resetDemo.addEventListener("click", () => {
    state.appointments = createSeedAppointments();
    state.schedule = structuredClone(defaultSchedule);
    state.selectedSlot = "";
    saveState();
    setDefaultBookingDate();
    renderAll();
    showToast("Demo data restored.");
  });
}

function setDefaultBookingDate() {
  dom.appointmentDate.min = toIsoDate(0);
  dom.appointmentDate.value = toIsoDate(1);
  dom.serviceSelect.value = services[0].id;
  dom.providerSelect.value = providers[0].id;
}

function init() {
  populateOptions();
  setDefaultBookingDate();
  bindEvents();
  renderAll();
}

init();
