// Avarin / Sia — key rack variation. The briefing demo, the week tabs and the entrances.
document.documentElement.classList.add("js");

/* ---------- her day: briefing by role ---------- */
const notes = {
  es: "Habitación 312, la pata de la silla está rota.",
  hi: "कमरा 312, कुर्सी का पैर टूटा है।",
  tl: "Kwarto 312, sira ang paa ng upuan.",
  pt: "Quarto 312, a perna da cadeira está partida.",
};

const briefings = {
  gm: {
    today: {
      when: "Briefing for the GM · Tuesday, 07:00",
      greet: "Good morning. Three things need you today.",
      items: [
        { text: "Room 204 mentioned a slow shower drain in a review and at the desk. Maintenance has it, due before noon.", tags: [["High priority", "hi"], ["Maintenance"]] },
        { text: "A three-star review about late check-out came in overnight. My draft reply is with your GRM.", tags: [["To approve"], ["Guest relations"]] },
        { text: "Four arrivals tonight asked about parking. I added it to the front desk handover.", tags: [["Done"], ["Front office"]] },
      ],
    },
    week: {
      when: "Weekly meeting with the GM · Monday, 10:30",
      greet: "Here is the week, in the order I would take it.",
      items: [
        { text: "Breakfast wait came up in five reviews this week, all on weekends. I suggest a second toaster line on Saturdays.", tags: [["Repeat issue", "hi"], ["Food and beverage"]] },
        { text: "Eleven issues closed, two still open. Both are with maintenance and on track.", tags: [["Follow-up"], ["Maintenance"]] },
        { text: "Your GRM approved fourteen replies and changed two. I have taken note of the changes.", tags: [["Learned"], ["Guest relations"]] },
      ],
    },
  },
  dept: {
    today: {
      when: "Briefing for the head of maintenance · Tuesday, 07:00",
      greet: "Two new issues for you this morning.",
      items: [
        { text: "Room 204, shower drains slowly. Last time you sent a plumber before 11:00 and offered a late check-out. I have suggested the same.", tags: [["High priority", "hi"], ["Suggested fix"]] },
        { text: "Room 312, broken chair leg, with a photo from housekeeping. The room is empty until 15:00.", tags: [["Assigned to you"], ["Photo attached"]] },
      ],
    },
    week: {
      when: "Weekly meeting · Monday, 10:30",
      greet: "Your department this week.",
      items: [
        { text: "Six issues opened, five closed. Shower drains on the second floor came up three times.", tags: [["Repeat issue", "hi"], ["Second floor"]] },
        { text: "Air conditioning in 118 is waiting for a part. I will remind you on Thursday.", tags: [["Follow-up"], ["Room 118"]] },
      ],
    },
  },
  grm: {
    today: {
      when: "Briefing for guest relations · Tuesday, 07:00",
      greet: "Three replies are ready for you.",
      items: [
        { text: "“Thank you for staying with us, and for telling us about the shower in room 204. Our team fixed it the same morning…”", tags: [["Draft reply"], ["Three stars"]], quote: true },
        { text: "Two shorter replies to five-star reviews, written the way you edited last week’s.", tags: [["To approve"], ["Five stars"]] },
        { text: "One review mentions a staff member by name. I left that reply for you to write.", tags: [["Needs you", "hi"]] },
      ],
    },
    week: {
      when: "Weekly meeting · Monday, 10:30",
      greet: "What guests said this week.",
      items: [
        { text: "Most praised: the front desk by name, the terrace, the beds. Most raised: breakfast wait at weekends.", tags: [["Summary"]] },
        { text: "Every review has a reply. Two are waiting for your approval.", tags: [["To approve"], ["Two replies"]] },
      ],
    },
  },
  hk: {
    today: {
      when: "Housekeeping · Tuesday, 09:40",
      greet: "Your note is with maintenance.",
      items: [
        { text: "", tags: [["Photo attached"], ["Translated"]], note: true },
        { text: "Room 312, broken chair leg. Sent to maintenance, who has the photo. You can carry on with the room.", tags: [["Issue opened", "hi"], ["Maintenance"]] },
      ],
    },
    week: {
      when: "Housekeeping · Monday",
      greet: "This week, from the floor.",
      items: [
        { text: "Nine notes sent from rooms, all translated and routed. Seven fixed, two booked for Wednesday.", tags: [["Follow-up"]] },
      ],
    },
  },
};

const form = document.getElementById("controls");
const out = {
  when: document.getElementById("demo-when"),
  greet: document.getElementById("demo-greet"),
  ask: document.getElementById("demo-ask"),
  items: document.getElementById("demo-items"),
};

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function renderBriefing() {
  const role = form.elements.role.value;
  const when = form.elements.when.value;
  const lang = form.elements.lang.value;
  const b = briefings[role][when];
  out.when.textContent = b.when;
  out.greet.textContent = b.greet;
  out.ask.textContent = role === "hk" && when === "today" ? "Sent a photo from room 312" : "What do I need to know today?";
  out.items.replaceChildren(
    ...b.items.map((item) => {
      const li = el("li");
      if (item.note) {
        li.append(el("p", "orig", "“" + notes[lang] + "”"));
        li.append(el("p", null, "Room 312, the chair leg is broken."));
      } else {
        li.append(el("p", item.quote ? "orig" : null, item.text));
      }
      const meta = el("div", "meta");
      item.tags.forEach(([t, k]) => meta.append(el("span", "tag" + (k ? " " + k : ""), t)));
      li.append(meta);
      return li;
    })
  );
}
form.addEventListener("change", renderBriefing);
renderBriefing();

const week = [
  { d: "Mon", date: "2 Nov", rows: [
    ["07:00", "Morning briefing", "Ready when the GM asks what they need to know", ["S", "GM"], "GM"],
    ["10:30", "Weekly meeting with the GM", "She books it, sends the invite and brings the week", ["S", "GM"], "GM", true],
    ["15:00", "Review replies drafted", "Weekend reviews answered, waiting for approval", ["S", "GR"], "GRM"],
    ["22:00", "Night handover", "Open issues and late arrivals for the duty manager", ["S", "DM"], "Duty manager"],
  ]},
  { d: "Tue", date: "3 Nov", rows: [
    ["07:00", "Morning briefing", "Three things, in order of urgency", ["S", "GM"], "GM"],
    ["09:40", "Note from room 312", "Translated from housekeeping, sent to maintenance", ["S", "HK"], "Housekeeping", true],
    ["11:00", "Follow-up on room 204", "Checks the plumber came and the guest was told", ["S", "MT"], "Maintenance"],
  ]},
  { d: "Wed", date: "4 Nov", rows: [
    ["07:00", "Morning briefing", "A quiet night, one review to approve", ["S", "GM"], "GM"],
    ["14:00", "Repeat issue flagged", "Breakfast wait mentioned again, sent to food and beverage", ["S", "FB"], "F&B manager"],
    ["16:30", "Replies drafted", "Four reviews, two languages", ["S", "GR"], "GRM"],
  ]},
  { d: "Thu", date: "5 Nov", rows: [
    ["07:00", "Morning briefing", "Group arriving Friday, two open issues on their floor", ["S", "GM"], "GM"],
    ["10:00", "Reminder sent", "Air conditioning part for room 118", ["S", "MT"], "Maintenance"],
  ]},
  { d: "Fri", date: "6 Nov", rows: [
    ["07:00", "Morning briefing", "Arrivals, the group, and the weekend forecast", ["S", "GM"], "GM"],
    ["12:00", "Competitor check", "What guests said this week at the hotel you track", ["S", "GM"], "GM"],
    ["18:00", "Evening handover", "Issues still open going into the weekend", ["S", "FO"], "Front office"],
  ]},
  { d: "Sat", date: "7 Nov", rows: [
    ["08:00", "Weekend briefing", "For the duty manager on shift", ["S", "DM"], "Duty manager"],
    ["13:00", "Issues routed", "Raised by guests during the day", ["S", "FO"], "Front office"],
  ]},
  { d: "Sun", date: "8 Nov", rows: [
    ["08:00", "Weekend briefing", "For the duty manager on shift", ["S", "DM"], "Duty manager"],
    ["20:00", "Week prepared", "Ready for Monday’s meeting at 10:30", ["S", "GM"], "GM"],
  ]},
];

/* ---------- her week: a calendar, one column per day ---------- */
const cal = document.getElementById("cal");
week.forEach((day, i) => {
  const col = el("section", "cal-day" + (i === 0 ? " is-today" : ""));
  col.setAttribute("aria-label", day.d + " " + day.date);
  const head = el("header");
  head.append(el("b", null, day.d), el("span", null, day.date));
  const list = el("ol");
  day.rows.forEach(([time, title, note, who, whoName, planned]) => {
    const ev = el("li", "ev" + (planned ? " ev-planned" : "") + (whoName === "GM" ? " ev-gm" : ""));
    const top = el("div", "ev-top");
    top.append(el("time", null, time));
    if (planned) top.append(el("span", "planned", "Planned"));
    ev.append(top, el("b", null, title), el("span", "ev-note", note), el("span", "ev-with", "with " + whoName));
    list.append(ev);
  });
  col.append(head, list);
  cal.append(col);
});

/* ---------- her team: one desk at a time ---------- */
const deskCaps = [
  "A briefing whenever you ask, ready before the first coffee.",
  "Each issue arrives with the fix your department used last time.",
  "Every review gets a draft in your hotel's voice. Approve it, or tell her what to change.",
  "Every hotel side by side, for the people allowed to see them.",
];
const deskTabs = [...document.querySelectorAll(".desk")];
const deskPanes = [...document.querySelectorAll("[data-pane]")];
const deskCap = document.getElementById("desk-cap");
function showDesk(i) {
  deskTabs.forEach((t, j) => { t.setAttribute("aria-selected", String(i === j)); t.tabIndex = i === j ? 0 : -1; });
  deskPanes.forEach((p, j) => { p.hidden = i !== j; });
  deskCap.textContent = deskCaps[i];
}
deskTabs.forEach((t, i) => {
  t.addEventListener("click", () => showDesk(i));
  t.addEventListener("keydown", (ev) => {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(ev.key)) return;
    ev.preventDefault();
    const n = (i + (ev.key === "ArrowDown" || ev.key === "ArrowRight" ? 1 : deskTabs.length - 1)) % deskTabs.length;
    showDesk(n);
    deskTabs[n].focus();
  });
});

/* ---------- entrances ---------- */
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const groups = new Map();
  reveals.forEach((r) => {
    const parent = r.parentElement;
    const n = groups.get(parent) || 0;
    r.style.setProperty("--d", n * 80 + "ms");
    groups.set(parent, n + 1);
  });
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }),
    { rootMargin: "0px 0px 40% 0px" }
  );
  reveals.forEach((r) => io.observe(r));
  // Anything scrolled past without being observed (fast jumps, anchors) shows at once.
  const sweep = () => reveals.forEach((r) => {
    if (!r.classList.contains("in") && r.getBoundingClientRect().top < innerHeight * 1.4) r.classList.add("in");
  });
  addEventListener("scroll", sweep, { passive: true });
  addEventListener("load", sweep);
} else {
  reveals.forEach((r) => r.classList.add("in"));
}
