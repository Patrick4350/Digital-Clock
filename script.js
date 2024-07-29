const hoursElem = document.getElementById("hours");
const minutesElem = document.getElementById("minutes");
const secondsElem = document.getElementById("seconds");
const infoElem = document.getElementById("info");
const timeZoneForm = document.getElementById("timeZoneForm");
const cityInput = document.getElementById("cityInput");
const alarmSound = document.getElementById("alarmSound");
const alarmList = document.getElementById("alarmList");
const stopAlarmButton = document.getElementById("stopAlarm");
const errorMessage = document.getElementById("error-message");
const lapButton = document.getElementById("lapStopwatch");
const lapList = document.getElementById("lapList");

let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
let alarms = JSON.parse(localStorage.getItem('alarms')) || [];
let alarmInterval = null;
let snoozeDuration = 60000; // 1 minute in milliseconds
let laps = []; // Initialize laps array

const loadingOverlay = document.getElementById('loadingOverlay');

// Show loader
const showLoader = () => {
    loadingOverlay.style.display = 'flex';
};

// Hide loader
const hideLoader = () => {
    loadingOverlay.style.display = 'none';
};

// Example usage
showLoader();
// Simulate a delay for demonstration (e.g., during data loading)
setTimeout(hideLoader, 2000); // Hide after 2 seconds

const updateClock = () => {
    const currentTime = new Date().toLocaleString("en-US", { timeZone });
    const [date, time] = currentTime.split(", ");
    const [hours, minutes, seconds] = time.split(":");

    hoursElem.textContent = hours.padStart(2, "0");
    minutesElem.textContent = minutes.padStart(2, "0");
    secondsElem.textContent = seconds.padStart(2, "0");

    checkAlarms();
};

const checkAlarms = () => {
    const now = new Date();
    const formattedNow = now.toTimeString().slice(0, 5);

    alarms.forEach(alarm => {
        if (formattedNow === alarm.time) {
            ringAlarm();
            if (alarm.snooze) {
                setTimeout(() => {
                    ringAlarm();
                    alarm.snooze = false; // Reset snooze after first snooze
                    localStorage.setItem('alarms', JSON.stringify(alarms));
                    renderAlarms();
                }, snoozeDuration);
            }
            removeAlarm(alarm.time);
        }
    });
};

const ringAlarm = () => {
    alarmSound.loop = true;
    alarmSound.play();
    triggerAlarmAnimation();
};

const stopAlarm = () => {
    alarmSound.loop = false;
    alarmSound.pause();
    alarmSound.currentTime = 0;
    document.querySelector(".digital-clock").classList.remove("alarm-trigger");
};

const snoozeAlarm = () => {
    stopAlarm();
    alarms.forEach(alarm => {
        if (alarm.snooze) {
            setTimeout(() => {
                ringAlarm();
            }, snoozeDuration);
        }
    });
};

const addAlarm = (time) => {
    alarms.push({ time, snooze: false });
    localStorage.setItem('alarms', JSON.stringify(alarms));
    renderAlarms();
};

const removeAlarm = (time) => {
    alarms = alarms.filter(alarm => alarm.time !== time);
    localStorage.setItem('alarms', JSON.stringify(alarms));
    renderAlarms();
};

const editAlarm = (oldTime, newTime) => {
    alarms = alarms.map(alarm => alarm.time === oldTime ? { time: newTime, snooze: alarm.snooze } : alarm);
    localStorage.setItem('alarms', JSON.stringify(alarms));
    renderAlarms();
};

const renderAlarms = () => {
    alarmList.innerHTML = "";

    alarms.forEach(alarm => {
        const li = document.createElement("li");
        li.textContent = alarm.time;

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.onclick = () => {
            const newTime = prompt("Enter new time:", alarm.time);
            if (newTime && /^([01]\d|2[0-3]):([0-5]\d)$/.test(newTime)) editAlarm(alarm.time, newTime);
            else alert("Invalid time format. Please use HH:MM format.");
        };

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.onclick = () => removeAlarm(alarm.time);

        const snoozeButton = document.createElement("button");
        snoozeButton.textContent = "Snooze";
        snoozeButton.className = "snooze-button";
        snoozeButton.onclick = () => {
            alarm.snooze = true;
            localStorage.setItem('alarms', JSON.stringify(alarms));
            snoozeAlarm();
        };

        li.appendChild(editButton);
        li.appendChild(deleteButton);
        li.appendChild(snoozeButton);
        alarmList.appendChild(li);
    });
};

const triggerAlarmAnimation = () => {
    const digitalClock = document.querySelector(".digital-clock");
    digitalClock.classList.add("alarm-trigger");
};

const validateTimeZone = (zone) => {
    const timeZones = Intl.supportedValuesOf('timeZone').map(tz => tz.toUpperCase());
    return timeZones.includes(zone.toUpperCase());
};

timeZoneForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newTimeZone = cityInput.value;
    if (validateTimeZone(newTimeZone)) {
        timeZone = newTimeZone;
        errorMessage.textContent = ""; // Clear error message
        updateClock();
    } else {
        errorMessage.textContent = "Invalid time zone. Please enter a valid time zone (e.g., 'America/New_York').";
    }
});

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        timeZoneForm.dispatchEvent(new Event("submit"));
    }
});

const stopwatch = {
    startTime: 0,
    running: false,
    timer: null,
    elapsedTime: 0
};

const updateStopwatchDisplay = () => {
    const elapsed = stopwatch.elapsedTime + (stopwatch.running ? Date.now() - stopwatch.startTime : 0);
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    document.getElementById("stopwatchDisplay").textContent =
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const addLap = () => {
    if (!stopwatch.running) return; // Only add laps if the stopwatch is running
    const elapsed = stopwatch.elapsedTime + (stopwatch.running ? Date.now() - stopwatch.startTime : 0);
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const lapTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    laps.push(lapTime);
    renderLaps(); // Update lap list
};

const renderLaps = () => {
    lapList.innerHTML = ""; // Clear existing lap list
    laps.forEach((lap, index) => {
        const li = document.createElement("li");
        li.textContent = `Lap ${index + 1}: ${lap}`;
        lapList.appendChild(li);
    });
};

document.getElementById("startStopwatch").addEventListener("click", () => {
    if (!stopwatch.running) {
        stopwatch.startTime = Date.now() - stopwatch.elapsedTime;
        stopwatch.timer = setInterval(updateStopwatchDisplay, 1000);
        stopwatch.running = true;
    }
});

document.getElementById("stopStopwatch").addEventListener("click", () => {
    if (stopwatch.running) {
        clearInterval(stopwatch.timer);
        stopwatch.elapsedTime += Date.now() - stopwatch.startTime;
        stopwatch.running = false;
    }
});

document.getElementById("resetStopwatch").addEventListener("click", () => {
    clearInterval(stopwatch.timer);
    stopwatch.elapsedTime = 0;
    stopwatch.running = false;
    updateStopwatchDisplay();
    laps = []; // Clear laps on reset
    renderLaps();
});

lapButton.addEventListener("click", addLap); // Ensure lapButton is properly referenced

document.getElementById("setAlarm").addEventListener("click", () => {
    const alarmTime = document.getElementById("alarmTime").value;
    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(alarmTime)) {
        addAlarm(alarmTime);
        document.getElementById("alarmTime").value = "";
    } else {
        alert("Invalid time format. Please use HH:MM format.");
    }
});

stopAlarmButton.addEventListener("click", stopAlarm);

updateClock();
setInterval(updateClock, 1000); // Update the clock every second

let lastScrollTop = 0;
const footer = document.querySelector('.footer');

window.addEventListener('scroll', () => {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScrollTop > lastScrollTop) {
        // Scrolling down
        footer.classList.remove('show');
        footer.classList.add('hide');
    } else {
        // Scrolling up
        footer.classList.remove('hide');
        footer.classList.add('show');
    }

    lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop; // For Mobile or negative scrolling
});
