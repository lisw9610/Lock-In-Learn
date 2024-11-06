//calendar from lab 4
const CALENDAR_EVENTS = [
    {
      name: 'Running',
      day: 'wednesday',
      time: '09:00',
      modality: 'In-person',
      location: 'Boulder',
      url: '',
      attendees: 'Alice, Jack, Ben',
    },
  ];
  
  const CALENDAR_DAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  
  let EVENT_MODAL;
  
  /********************** PART B: 6.1: CREATE CALENDAR *************************/
  
  function createBootstrapCard(day) {
    const card = document.createElement('div');
    card.className = 'col-sm m-1 bg-white rounded px-1 px-md-2';
    card.id = day.toLowerCase();
    return card;
  }
  
  function createTitle(day) {
    const title = document.createElement('div');
    title.className = 'h6 text-center position-relative py-2';
    title.innerHTML = day;
    return title;
  }
  
  function createEventIcon(card) {
    const icon = document.createElement('i');
    icon.className = 'bi bi-calendar-plus btn position-absolute translate-middle start-100 rounded p-0 btn-link';
    icon.setAttribute('onclick', `openEventModal({day: '${card.id}'})`); // Corrected this line
    return icon;
  }
  
  function createEventDiv() {
    const eventsDiv = document.createElement('div');
    eventsDiv.classList.add('event-container');
    return eventsDiv;
  }
  
  function initializeCalendar() {
    initializeEventModal();
    const calendarElement = document.getElementById('calendar');
  
    CALENDAR_DAYS.forEach(day => {
      const card = createBootstrapCard(day);
      calendarElement.appendChild(card);
  
      const title = createTitle(day);
      card.appendChild(title);
  
      const icon = createEventIcon(card);
      title.appendChild(icon);
  
      const eventsDiv = createEventDiv();
      card.appendChild(eventsDiv);
    });
  
    updateDOM(); 
  }
  
  /********************** PART B: 6.2: CREATE MODAL ****************************/
  
  function initializeEventModal() {
    EVENT_MODAL = new bootstrap.Modal(document.getElementById('event-modal'));
  }
  
  function openEventModal({id, day}) {
    const submit_button = document.querySelector("#submit_button");
    const modal_title = document.querySelector(".modal-title");
  
    let event = CALENDAR_EVENTS[id];
  
    if (!event) {
      event = {
        name: "",
        day: day,
        time: "",
        modality: "",
        location: "",
        url: "",
        attendees: "",
      };
      modal_title.innerHTML = "Create Event";
      submit_button.innerHTML = "Create Event";
      id = CALENDAR_EVENTS.length; // Assign the new event ID
    } else {
      modal_title.innerHTML = "Update Event";
      submit_button.innerHTML = "Update Event";
    }
  
    document.querySelector("#event_name").value = event.name;
    document.querySelector("#event_weekday").value = event.day; // Correctly setting the day
    document.querySelector("#event_time").value = event.time;
    document.querySelector("#event_modality").value = event.modality;
    document.querySelector("#event_location").value = event.location;
    document.querySelector("#event_remote_url").value = event.url;
    document.querySelector("#event_attendees").value = event.attendees;
  
    updateLocationOptions(event.modality);
  
    const form = document.querySelector("#event-modal form");
    form.setAttribute("action", `javascript:updateEventFromModal(${id})`);
  
    EVENT_MODAL.show();
  }
  
  function updateEventFromModal(id) {
    CALENDAR_EVENTS[id] = {
      name: document.querySelector('#event_name').value,
      day: document.querySelector('#event_weekday').value.toLowerCase(),
      time: document.querySelector('#event_time').value,
      modality: document.querySelector('#event_modality').value,
      location: document.querySelector('#event_location').value,
      url: document.querySelector('#event_remote_url').value,
      attendees: document.querySelector('#event_attendees').value,
    };
  
    updateDOM();
    EVENT_MODAL.hide();
  }
  
  function updateLocationOptions(modality_value) {
    const location = document.getElementById('in-person');
    const remoteUrl = document.getElementById('remote');
  
    if (modality_value.toLowerCase() === "in-person") {
      location.style.display = 'block';
      remoteUrl.style.display = 'none';
    } else {
      location.style.display = 'none';
      remoteUrl.style.display = 'block'; 
    }
  }
  
  /********************** PART B: 6.3: UPDATE DOM ******************************/
  
  function createEventElement(id) {
    const eventElement = document.createElement('div');
    eventElement.classList = "event row border rounded m-1 py-1";
    eventElement.id = `event-${id}`;
    return eventElement;
  }
  
  function createTitleForEvent(event) {
    const title = document.createElement('div');
    title.classList.add('col', 'event-title');
    title.innerHTML = event.name;
    return title;
  }
  
  function updateDOM() {
    const events = CALENDAR_EVENTS;
  
    events.forEach((event, id) => {
      let eventElement = document.querySelector(`#event-${id}`);
  
      // If event exists in DOM, remove it before updating
      if (eventElement !== null) {
        eventElement.remove();
      }
  
      // Create a new event element after removing the old one
      eventElement = createEventElement(id);
      const title = createTitleForEvent(event);
      eventElement.appendChild(title);
  
      // Set the click action to open the modal with the event pre-populated
      eventElement.setAttribute('onclick', `openEventModal({id: ${id}})`);
  
      // Add the event div to the correct day in the calendar
      const eventContainer = document.querySelector(`#${event.day.toLowerCase()} .event-container`);
      if (eventContainer) {
        eventContainer.appendChild(eventElement);
      }
    });
  
    updateTooltips(); // Update tooltips after rendering the events
  }
  
  /********************** PART C: 1. Display Tooltip ***************************/
  
  function updateTooltips() {
    const events = CALENDAR_EVENTS;
  
    events.forEach((event, id) => {
      const eventElement = document.querySelector(`#event-${id}`);
  
      if (eventElement) {
        const tooltipContent = `
          <strong>Name:</strong> ${event.name}<br>
          <strong>Time:</strong> ${event.time || "N/A"}<br>
          <strong>Location:</strong> ${event.location || "N/A"}
        `;
  
        // Initialize Bootstrap tooltip using native JS
        const tooltip = new bootstrap.Tooltip(eventElement, {
          title: tooltipContent,
          html: true,
          placement: 'top',
        });
  
        eventElement.addEventListener('mouseenter', () => {
          tooltip.show();
        });
  
        eventElement.addEventListener('mouseleave', () => {
          tooltip.hide();
        });
      }
    });
  }
  