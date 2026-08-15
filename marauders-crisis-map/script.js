document.addEventListener("DOMContentLoaded", () => {
  // Theme toggle (light / dark)
  const themeBtn = document.querySelector(".theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");
      const isDark = document.body.classList.contains("dark-theme");
      themeBtn.innerHTML = isDark
        ? '<span>🌙</span><span>Dark</span>'
        : '<span>☀️</span><span>Light</span>';
    });
  }

  // Guidance instructions mapped by incident type
  const incidentGuidance = {
    "Flooding": "Avoid affected area, move to higher floors, and turn off nearby electrical equipment.",
    "Fire / Smoke": "Evacuate using nearest exits, do not use elevators, and assemble outside.",
    "Medical": "Keep area clear for emergency responders and provide basic first aid if trained.",
    "Power outage": "Stay in place, use emergency lights, and await updates from facilities.",
    "Security": "Lock doors, move away from windows, and report suspicious activity.",
    "Maintenance": "Report facility issues to the work order team. Keep work area clear of foot traffic.",
    "Other": "Exercise caution and follow local safety warden instructions."
  };

  // ==========================================
  // INCIDENTS PAGE: LocalStorage Persistence
  // ==========================================
  const incidentForm = document.getElementById("incident-form");
  const incidentTableBody = document.querySelector("#incident-table tbody");

  if (incidentForm && incidentTableBody) {
    const renderIncidentRow = (incident) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${incident.time}</td>
        <td>${incident.hostelBlock || 'N/A'}</td>
        <td>${incident.location}</td>
        <td>${incident.type}</td>
        <td>${incident.severity}</td>
        <td>${incident.status}</td>
      `;
      incidentTableBody.prepend(row);
    };

    const loadSavedIncidents = () => {
      const savedIncidents = localStorage.getItem("incidents");
      if (savedIncidents) {
        const incidentsArray = JSON.parse(savedIncidents);
        incidentsArray.forEach((incident) => renderIncidentRow(incident));
      }
    };

    loadSavedIncidents();

    incidentForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(incidentForm);
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const newIncident = {
        id: "#INC-" + Math.floor(100 + Math.random() * 900),
        time: time,
        hostelBlock: formData.get("hostel_block"),
        location: formData.get("location"),
        type: formData.get("type"),
        severity: formData.get("severity"),
        status: formData.get("status"),
        notes: formData.get("notes") || "",
      };

      const savedIncidents = localStorage.getItem("incidents");
      const incidentsArray = savedIncidents ? JSON.parse(savedIncidents) : [];

      incidentsArray.push(newIncident);
      localStorage.setItem("incidents", JSON.stringify(incidentsArray));

      renderIncidentRow(newIncident);
      incidentForm.reset();
    });
  }

  // ==========================================
  // WARDEN PORTAL: Robust Block-Based Incident Filtering
  // ==========================================
  const wardenTableBody = document.querySelector("#warden-incident-table tbody");
  if (wardenTableBody) {
    const normalizeBlock = (str) =>
      str ? str.toString().toLowerCase().replace(/[^a-z0-9]/g, "") : "";

    const urlParams = new URLSearchParams(window.location.search);
    let rawBlock = urlParams.get("hostel_block");

    if (rawBlock) {
      localStorage.setItem("wardenHostelBlock", rawBlock);
    } else {
      rawBlock = localStorage.getItem("wardenHostelBlock");
    }

    const activeBlock = normalizeBlock(rawBlock);

    if (activeBlock) {
      const savedIncidents = localStorage.getItem("incidents");
      if (savedIncidents) {
        const incidentsArray = JSON.parse(savedIncidents);
        incidentsArray
          .filter((inc) => normalizeBlock(inc.hostelBlock) === activeBlock)
          .forEach((inc) => {
            const row = document.createElement("tr");
            row.setAttribute("data-hostel-block", inc.hostelBlock);
            const pillClass = inc.status === "Resolved" ? "ok" : "alert";
            row.innerHTML = `
              <td>${inc.id || '#INC-' + Math.floor(100 + Math.random() * 900)}</td>
              <td>${inc.time}</td>
              <td>${inc.hostelBlock}</td>
              <td>${inc.location}</td>
              <td>${inc.type}</td>
              <td>${inc.severity}</td>
              <td>${inc.notes || 'N/A'}</td>
              <td><span class="zone-status-pill ${pillClass}">${inc.status}</span></td>
              <td>
                <select onchange="updateStatus(this)">
                  <option value="Open" ${inc.status === 'Open' ? 'selected' : ''}>Open</option>
                  <option value="In progress" ${inc.status === 'In progress' ? 'selected' : ''}>In progress</option>
                  <option value="Resolved" ${inc.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                </select>
              </td>
            `;
            wardenTableBody.prepend(row);
          });
      }

      const rows = wardenTableBody.querySelectorAll("tr");
      rows.forEach((row) => {
        const rowBlock = normalizeBlock(row.getAttribute("data-hostel-block"));
        if (rowBlock && rowBlock !== activeBlock) {
          row.style.display = "none";
        } else {
          row.style.display = "";
        }
      });
    }
  }

  // ==========================================
  // ROLES PAGE: Filtering
  // ==========================================
  const filterButtons = document.querySelectorAll("[data-role-filter]");
  const roleCards = document.querySelectorAll("[data-role]");

  if (filterButtons.length && roleCards.length) {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.roleFilter;

        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        roleCards.forEach((card) => {
          const role = card.dataset.role;
          if (filter === "all" || role === filter) {
            card.style.display = "";
          } else {
            card.style.display = "none";
          }
        });
      });
    });
  }
});

// Helper for Warden Portal dropdown changes
function updateStatus(selectElement) {
  const row = selectElement.closest('tr');
  const statusPill = row.querySelector('.zone-status-pill');
  if (statusPill) {
    statusPill.textContent = selectElement.value;
    statusPill.className = `zone-status-pill ${selectElement.value === 'Resolved' ? 'ok' : 'alert'}`;
  }
}