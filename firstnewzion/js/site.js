"use strict";

/* =============================================================
   FIRST NEW ZION MISSIONARY BAPTIST CHURCH
   PUBLIC WEBSITE CONTROLLER
   ============================================================= */

const FNZ_API_URL =
    "https://fnz-website-api.904degreeslabs.workers.dev";


/* =============================================================
CHURCH SOCIAL LINKS

Change addresses HERE and every social button on the website
using data-social will update automatically.
============================================================= */

const FNZ_SOCIAL_LINKS = {

    facebook:
        "https://www.facebook.com/FirstNewZion1",

    instagram:
        "https://www.instagram.com/firstnewzion",

    youtube:
        "https://www.youtube.com/channel/UCnTqqNIG1pqabgn7JUJgzYQ"

};


/* =============================================================
   STARTUP
   ============================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    initializeMobileNavigation();
    initializeActiveNavigation(path, params);
    initializeHomeLinks();
    initializeSocialLinks();
    initializeSiteBranding();
    initializePublicMediaGallery();


    /* ---------------------------------------------------------
       HOMEPAGE
       --------------------------------------------------------- */

    if (
        path.endsWith("/") ||
        path.endsWith("/firstnewzion/index.html")
    ) {
        initializeHomepageEvents();
        initializeDailyVerse();
    }

    /* ---------------------------------------------------------
       EVENTS PAGE

       IMPORTANT:
       Cloudflare may serve /firstnewzion/events.html as /events.
       Support BOTH.
       --------------------------------------------------------- */

    if (
        path.endsWith("/events") ||
        path.endsWith("/firstnewzion/events.html")
    ) {
        initializeEventsPage(params);
    }

    /* ---------------------------------------------------------
       SINGLE EVENT PAGE

       Support both /event and /firstnewzion/event.html.
       --------------------------------------------------------- */

    if (
        path.endsWith("/event") ||
        path.endsWith("/firstnewzion/event.html")
    ) {
        initializeEventDetailPage(params);
    }

});

/* =============================================================
   SOCIAL LINKS

   Any HTML link with:

       data-social="facebook"
       data-social="instagram"
       data-social="youtube"

   automatically receives the correct church social address.

   This lets every page use the same centralized configuration.
   ============================================================= */

function initializeSocialLinks() {

    document
        .querySelectorAll("[data-social]")
        .forEach(link => {

            const service =
                link.dataset.social;

            const url =
                FNZ_SOCIAL_LINKS[service];

            if (!url) {
                return;
            }

            link.href = url;

            link.target = "_blank";

            link.rel =
                "noopener noreferrer";

        });

}



/* =============================================================
   MOBILE NAVIGATION
   ============================================================= */

function initializeMobileNavigation() {

    const button =
        document.querySelector(".mobile-menu-button");

    const links =
        document.querySelector(".nav-links");

    if (!button || !links) {
        return;
    }

    button.addEventListener("click", () => {

        links.classList.toggle("open");

        button.setAttribute(
            "aria-expanded",
            links.classList.contains("open")
                ? "true"
                : "false"
        );

    });

}


/* =============================================================
   ACTIVE NAVIGATION
   ============================================================= */

function initializeActiveNavigation(path, params) {

    const placeholderPage =
        params.get("page");

    document
        .querySelectorAll(".nav-links a")
        .forEach(link => {

            link.classList.remove("active");

            const href =
                link.getAttribute("href");

            if (!href) {
                return;
            }

            /* HOME */

            if (
                (
                    path.endsWith("/") ||
                    path.endsWith("/firstnewzion/index.html")
                ) &&
                href === "index.html"
            ) {
                link.classList.add("active");
                return;
            }

            /* EVENTS */

            if (
                (
                    path.endsWith("/events") ||
                    path.endsWith("/firstnewzion/events.html") ||
                    path.endsWith("/event") ||
                    path.endsWith("/firstnewzion/event.html")
                ) &&
                href === "events.html"
            ) {
                link.classList.add("active");
                return;
            }

            /* PLACEHOLDER PAGES */

            if (!placeholderPage) {
                return;
            }

            try {

                const url =
                    new URL(
                        href,
                        window.location.href
                    );

                if (
                    url.searchParams.get("page") ===
                    placeholderPage
                ) {
                    link.classList.add("active");
                }

            }
            catch (error) {

                console.warn(
                    "Unable to inspect navigation link:",
                    href
                );

            }

        });

}


/* =============================================================
   HOME BUTTON

   HOME always means:
   TOP OF HOMEPAGE.

   Browser Back still remembers the old scroll position.
   ============================================================= */

function initializeHomeLinks() {

    document
        .querySelectorAll('a[href="index.html"]')
        .forEach(link => {

            link.addEventListener("click", () => {

                sessionStorage.setItem(
                    "fnz-force-home-top",
                    "true"
                );

                const homePath =
                    new URL(
                        "index.html",
                        window.location.href
                    ).pathname;

                sessionStorage.removeItem(
                    "fnz-scroll-" + homePath
                );

            });

        });

}


/* =============================================================
   API
   ============================================================= */

async function getPublishedEvents() {

    const response =
        await fetch(
            `${FNZ_API_URL}/api/events`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            }
        );

    let data;

    try {
        data = await response.json();
    }
    catch (error) {
        throw new Error(
            "The event server returned an invalid response."
        );
    }

    if (!response.ok) {

        throw new Error(
            data?.error ||
            `Unable to load events (${response.status}).`
        );

    }

    const events =
        Array.isArray(data?.events)
            ? data.events
            : [];

    events.sort(compareEventsByDate);

    return events;
}




/* =============================================================
   DAILY VERSE
   The Worker selects the verse by Jacksonville calendar day.
   The hard-coded hero verse remains a graceful fallback.
   ============================================================= */

async function initializeDailyVerse() {
    const textElement = document.getElementById("daily-verse-text");
    const referenceElement = document.getElementById("daily-verse-reference");
    if (!textElement || !referenceElement) return;

    try {
        const response = await fetch(`${FNZ_API_URL}/api/daily-verse`, {
            headers: { "Accept": "application/json" }
        });
        if (!response.ok) throw new Error(`Daily verse request failed: ${response.status}`);
        const verse = await response.json();
        if (!verse || !verse.text || !verse.reference) return;
        textElement.textContent = `“${verse.text}”`;
        referenceElement.textContent = `${verse.reference} (${verse.versionAbbreviation || "KJV"})`.toUpperCase();
    }
    catch (error) {
        console.error("Unable to load daily verse:", error);
    }
}


/* =============================================================
   HOMEPAGE EVENTS
   ============================================================= */

async function initializeHomepageEvents() {

    const container =
        document.getElementById("homepage-events");

    if (!container) {
        return;
    }

    try {

        const events =
            await getPublishedEvents();

        renderHomepageEvents(
            events.slice(0, 3)
        );

    }
    catch (error) {

        console.error(
            "Unable to load homepage events:",
            error
        );

        container.innerHTML = `
            <div class="homepage-events-empty">

                <h3>
                    EVENTS TEMPORARILY UNAVAILABLE
                </h3>

                <p>
                    Please check back shortly.
                </p>

            </div>
        `;

    }

}


/* =============================================================
   HOMEPAGE EVENT RENDERER
   ============================================================= */

function renderHomepageEvents(events) {

    const container =
        document.getElementById("homepage-events");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!events.length) {

        container.innerHTML = `
            <div class="homepage-events-empty">

                <h3>
                    MORE EVENTS COMING SOON
                </h3>

                <p>
                    Check back soon for upcoming
                    First New Zion events and announcements.
                </p>

            </div>
        `;

        return;
    }

    events.forEach(event => {

        container.insertAdjacentHTML(
            "beforeend",
            createHomepageEventCard(event)
        );

    });

}


/* =============================================================
   HOMEPAGE EVENT CARD

   This restores the structure expected by the original FNZ CSS:

       article.event-card
           div.event-thumb
               image
               date tile

           div
               title
               date/time
               location
               description

   The entire card remains clickable.
   ============================================================= */

function createHomepageEventCard(event) {

    const date =
        formatEventDate(event.event_date);

    const title =
        escapeHtml(event.title || "Event");

    const dateLine =
        escapeHtml(formatEventDateLine(event));

    const location =
        escapeHtml(event.location || "");

    const description =
        escapeHtml(event.description || "");

    const imageUrl =
        safeImageUrl(event.image_url);

    const href =
        event.id !== undefined &&
            event.id !== null
            ? `event.html?id=${encodeURIComponent(event.id)}`
            : "#";

    let imageHtml;

    if (imageUrl) {

        imageHtml = `
            <img
                src="${escapeHtml(imageUrl)}"
                alt="${title}"
            >
        `;

    }
    else {

        /*
         * Keep the thumbnail box even when there is no image.
         * This preserves the original homepage card geometry.
         */

        imageHtml = `
            <div
                class="event-image-placeholder"
                aria-hidden="true">
            </div>
        `;

    }

    return `
        <article class="event-card">

            <div class="event-thumb">

                ${imageHtml}

                <div class="event-date">

                    <span>
                        ${date.month}
                    </span>

                    <strong>
                        ${date.day}
                    </strong>

                </div>

            </div>


            <div class="event-card-content">

                <h3>
                    <a href="${href}">
                        ${title}
                    </a>
                </h3>


                ${dateLine
            ? `
                            <strong>
                                ${dateLine}
                            </strong>
                          `
            : ""
        }


                ${location
            ? `
                            <div class="event-card-location">
                                ${location}
                            </div>
                          `
            : ""
        }


                ${description
            ? `
                            <p>
                                ${description}
                            </p>
                          `
            : ""
        }

            </div>


            <a
                class="event-card-overlay"
                href="${href}"
                aria-label="View ${title}">
            </a>

        </article>
    `;

}


/* =============================================================
   EVENTS LIST PAGE
   ============================================================= */

async function initializeEventsPage(params) {

    const container =
        document.getElementById("public-events-list");

    if (!container) {

        console.error(
            "Events page found, but #public-events-list is missing."
        );

        return;
    }


    /* ---------------------------------------------------------
       PUBLISHER PREVIEW
       --------------------------------------------------------- */

    if (params.get("preview") === "1") {

        const previewJson =
            sessionStorage.getItem("fnzEventPreview");

        if (previewJson) {

            try {

                const previewEvent =
                    JSON.parse(previewJson);

                renderEventsList(
                    [previewEvent],
                    true
                );

                return;

            }
            catch (error) {

                console.error(
                    "Unable to read Publisher preview:",
                    error
                );

            }

        }

    }


    /* ---------------------------------------------------------
       LIVE EVENTS
       --------------------------------------------------------- */

    try {

        const events =
            await getPublishedEvents();

        renderEventsList(
            events,
            false
        );

    }
    catch (error) {

        console.error(
            "Unable to load events page:",
            error
        );

        showEventsListError(
            error.message
        );

    }

}


/* =============================================================
   EVENTS LIST RENDERER
   ============================================================= */

function renderEventsList(events, previewMode) {

    const container =
        document.getElementById("public-events-list");

    if (!container) {
        return;
    }

    container.innerHTML = "";


    /* ---------------------------------------------------------
       PREVIEW NOTICE
       --------------------------------------------------------- */

    if (previewMode) {

        container.insertAdjacentHTML(
            "beforeend",
            `
                <div class="event-preview-notice">

                    <strong>
                        PUBLISHER PREVIEW
                    </strong>

                    <p>
                        This event is being previewed before publication.
                    </p>

                </div>
            `
        );

    }


    /* ---------------------------------------------------------
       EMPTY STATE
       --------------------------------------------------------- */

    if (!events.length) {

        container.insertAdjacentHTML(
            "beforeend",
            `
                <div class="events-empty-state">

                    <h2>
                        No Upcoming Events
                    </h2>

                    <p>
                        Please check back soon for upcoming
                        church events and announcements.
                    </p>

                </div>
            `
        );

        return;
    }


    /* ---------------------------------------------------------
       EVENT CARDS
       --------------------------------------------------------- */

    events.forEach(event => {

        container.insertAdjacentHTML(
            "beforeend",
            createPublicEventCard(
                event,
                previewMode
            )
        );

    });

}


/* =============================================================
   PUBLIC EVENTS PAGE CARD
   ============================================================= */

function createPublicEventCard(
    event,
    previewMode
) {

    const date =
        formatEventDate(event.event_date);

    const title =
        escapeHtml(event.title || "Event");

    const dateLine =
        escapeHtml(formatEventDateLine(event));

    const location =
        escapeHtml(event.location || "");

    const description =
        escapeHtml(event.description || "");

    let href;

    if (previewMode) {

        href =
            "event.html?preview=1";

    }
    else if (
        event.id !== undefined &&
        event.id !== null
    ) {

        href =
            `event.html?id=${encodeURIComponent(event.id)}`;

    }
    else {

        href = "#";

    }


    return `
        <a
            class="event-detail-card"
            href="${href}">

            <div class="event-date">

                <span>
                    ${date.month}
                </span>

                <strong>
                    ${date.day}
                </strong>

            </div>


            <div>

                <h2>
                    ${title}
                </h2>


                ${dateLine
            ? `
                            <strong>
                                ${dateLine}
                            </strong>
                          `
            : ""
        }


                ${location
            ? `
                            <div class="event-location">
                                ${location}
                            </div>
                          `
            : ""
        }


                ${description
            ? `
                            <p>
                                ${description}
                            </p>
                          `
            : ""
        }


                <span class="event-more">
                    VIEW EVENT →
                </span>

            </div>

        </a>
    `;

}


/* =============================================================
   EVENTS PAGE ERROR
   ============================================================= */

function showEventsListError(message) {

    const container =
        document.getElementById("public-events-list");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="events-empty-state">

            <h2>
                Events Temporarily Unavailable
            </h2>

            <p>
                Please check back shortly.
            </p>

        </div>
    `;

    console.error(
        "Public events error:",
        message
    );

}


/* =============================================================
   SINGLE EVENT PAGE
   ============================================================= */

async function initializeEventDetailPage(params) {

    const previewMode =
        params.get("preview") === "1";


    /* ---------------------------------------------------------
       PUBLISHER PREVIEW
       --------------------------------------------------------- */

    if (previewMode) {

        const previewJson =
            sessionStorage.getItem("fnzEventPreview");

        if (!previewJson) {

            showEventDetailError();
            return;

        }

        try {

            const previewEvent =
                JSON.parse(previewJson);

            renderEventDetail(
                previewEvent,
                true
            );

            return;

        }
        catch (error) {

            console.error(
                "Unable to read event preview:",
                error
            );

            showEventDetailError();
            return;

        }

    }


    /* ---------------------------------------------------------
       LIVE EVENT
       --------------------------------------------------------- */

    const eventId =
        params.get("id");

    if (!eventId) {

        showEventDetailError();
        return;

    }

    try {

        const response =
            await fetch(
                `${FNZ_API_URL}/api/events/${encodeURIComponent(eventId)}`,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    },
                    cache: "no-store"
                }
            );

        let data;

        try {
            data = await response.json();
        }
        catch (error) {
            throw new Error(
                "The event server returned an invalid response."
            );
        }

        if (!response.ok) {

            throw new Error(
                data?.error ||
                "Event not found."
            );

        }

        if (!data?.event) {

            throw new Error(
                "Event not found."
            );

        }

        renderEventDetail(
            data.event,
            false
        );

    }
    catch (error) {

        console.error(
            "Unable to load event:",
            error
        );

        showEventDetailError();

    }

}


/* =============================================================
   SINGLE EVENT RENDERER
   ============================================================= */

function renderEventDetail(
    event,
    previewMode
) {

    const date =
        formatEventDate(event.event_date);

    const monthElement =
        document.getElementById("event-month");

    const dayElement =
        document.getElementById("event-day");

    const nameElement =
        document.getElementById("event-name");

    const timeElement =
        document.getElementById("event-time");

    const locationElement =
        document.getElementById("event-location");

    const descriptionElement =
        document.getElementById("event-description");

    const optionalImage =
        document.getElementById("optional-image");

    const imageElement =
        document.getElementById("event-image");

    const errorElement =
        document.getElementById("event-error");


    if (errorElement) {
        errorElement.hidden = true;
    }


    /* ---------------------------------------------------------
       DATE TILE
       --------------------------------------------------------- */

    if (monthElement) {
        monthElement.textContent =
            date.month;
    }

    if (dayElement) {
        dayElement.textContent =
            date.day;
    }


    /* ---------------------------------------------------------
       TITLE
       --------------------------------------------------------- */

    if (nameElement) {

        nameElement.textContent =
            event.title ||
            "Event";

    }


    /* ---------------------------------------------------------
       DATE / TIME
       --------------------------------------------------------- */

    const dateLine =
        formatEventDateLine(event);

    if (timeElement) {

        if (dateLine) {

            timeElement.textContent =
                dateLine;

            timeElement.hidden =
                false;

        }
        else {

            timeElement.hidden =
                true;

        }

    }


    /* ---------------------------------------------------------
       LOCATION
       --------------------------------------------------------- */

    if (locationElement) {

        if (event.location) {

            locationElement.textContent =
                event.location;

            locationElement.hidden =
                false;

        }
        else {

            locationElement.hidden =
                true;

        }

    }


    /* ---------------------------------------------------------
       DESCRIPTION
       --------------------------------------------------------- */

    if (descriptionElement) {

        if (event.description) {

            descriptionElement.textContent =
                event.description;

            descriptionElement.hidden =
                false;

        }
        else {

            descriptionElement.hidden =
                true;

        }

    }


    /* ---------------------------------------------------------
       OPTIONAL IMAGE
       --------------------------------------------------------- */

    const imageUrl =
        safeImageUrl(event.image_url);

    if (
        imageUrl &&
        optionalImage &&
        imageElement
    ) {

        imageElement.src =
            imageUrl;

        imageElement.alt =
            event.title
                ? `${event.title} event image`
                : "Event image";

        optionalImage.hidden =
            false;

    }
    else if (optionalImage) {

        optionalImage.hidden =
            true;

    }


    /* ---------------------------------------------------------
       BROWSER TITLE
       --------------------------------------------------------- */

    if (event.title) {

        document.title =
            `${event.title} | First New Zion`;

    }


    /* ---------------------------------------------------------
       PREVIEW INDICATOR
       --------------------------------------------------------- */

    if (previewMode) {

        const eyebrow =
            document.querySelector(
                ".event-expanded .eyebrow"
            );

        if (eyebrow) {

            eyebrow.textContent =
                "PUBLISHER PREVIEW";

        }

    }

}


/* =============================================================
   SINGLE EVENT ERROR
   ============================================================= */

function showEventDetailError() {

    const month =
        document.getElementById("event-month");

    const day =
        document.getElementById("event-day");

    const name =
        document.getElementById("event-name");

    const time =
        document.getElementById("event-time");

    const location =
        document.getElementById("event-location");

    const description =
        document.getElementById("event-description");

    const image =
        document.getElementById("optional-image");

    const error =
        document.getElementById("event-error");


    if (month) {
        month.textContent = "---";
    }

    if (day) {
        day.textContent = "--";
    }

    if (name) {
        name.textContent =
            "Event Not Available";
    }

    if (time) {
        time.hidden = true;
    }

    if (location) {
        location.hidden = true;
    }

    if (description) {
        description.hidden = true;
    }

    if (image) {
        image.hidden = true;
    }

    if (error) {
        error.hidden = false;
    }

}


/* =============================================================
   EVENT SORTING
   ============================================================= */

function compareEventsByDate(
    first,
    second
) {

    return (
        createEventSortValue(first) -
        createEventSortValue(second)
    );

}


function createEventSortValue(event) {

    const date =
        parseLocalDate(
            event?.event_date
        );

    if (!date) {
        return Number.MAX_SAFE_INTEGER;
    }

    let hour = 23;
    let minute = 59;

    if (Number(event?.is_all_day) === 1) {
        hour = 0;
        minute = 0;
    }
    else if (event.event_time) {

        const parts =
            String(event.event_time)
                .split(":");

        const parsedHour =
            Number(parts[0]);

        const parsedMinute =
            Number(parts[1] || 0);

        if (!Number.isNaN(parsedHour)) {
            hour = parsedHour;
        }

        if (!Number.isNaN(parsedMinute)) {
            minute = parsedMinute;
        }

    }

    date.setHours(
        hour,
        minute,
        0,
        0
    );

    return date.getTime();

}


/* =============================================================
   EVENT DATE / TIME DISPLAY

   Single day:
       Mon, Oct 5 • 10:30 AM

   Same-month multi-day:
       Oct 14 – 16 • 4:00 PM

   Cross-month:
       Oct 30 – Nov 2 • 7:00 PM
   ============================================================= */

function formatEventDateLine(event) {

    const start =
        parseLocalDate(
            event?.event_date
        );

    if (!start) {
        return "";
    }

    const end =
        parseLocalDate(
            event?.end_date
        );

    const time =
        Number(event?.is_all_day) === 1
            ? "All Day"
            : formatEventTime(
                event?.event_time
            );

    let dateText;


    /* ---------------------------------------------------------
       MULTI-DAY EVENT
       --------------------------------------------------------- */

    if (
        end &&
        end.getTime() !== start.getTime()
    ) {

        const sameYear =
            start.getFullYear() ===
            end.getFullYear();

        const sameMonth =
            sameYear &&
            start.getMonth() ===
            end.getMonth();


        if (sameMonth) {

            const month =
                start.toLocaleDateString(
                    "en-US",
                    {
                        month: "short"
                    }
                );

            dateText =
                `${month} ${start.getDate()} – ${end.getDate()}`;

        }
        else {

            const startText =
                start.toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        day: "numeric"
                    }
                );

            const endText =
                end.toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        day: "numeric"
                    }
                );

            dateText =
                `${startText} – ${endText}`;

        }

    }

    /* ---------------------------------------------------------
       SINGLE DAY EVENT
       --------------------------------------------------------- */

    else {

        dateText =
            start.toLocaleDateString(
                "en-US",
                {
                    weekday: "short",
                    month: "short",
                    day: "numeric"
                }
            );

    }


    if (time) {

        return `${dateText} • ${time}`;

    }

    return dateText;

}


/* =============================================================
   DATE TILE FORMATTER
   ============================================================= */

function formatEventDate(dateValue) {

    const date =
        parseLocalDate(dateValue);

    if (!date) {

        return {
            month: "",
            day: ""
        };

    }

    return {

        month:
            date
                .toLocaleDateString(
                    "en-US",
                    {
                        month: "short"
                    }
                )
                .toUpperCase(),

        day:
            String(
                date.getDate()
            )
                .padStart(
                    2,
                    "0"
                )

    };

}


/* =============================================================
   LOCAL DATE PARSER

   Do NOT use:

       new Date("2026-10-05")

   because UTC conversion can move the date backward
   depending on the visitor's time zone.
   ============================================================= */

function parseLocalDate(value) {

    if (!value) {
        return null;
    }

    const parts =
        String(value)
            .trim()
            .split("-");

    if (parts.length !== 3) {
        return null;
    }

    const year =
        Number(parts[0]);

    const month =
        Number(parts[1]);

    const day =
        Number(parts[2]);

    if (
        Number.isNaN(year) ||
        Number.isNaN(month) ||
        Number.isNaN(day)
    ) {
        return null;
    }

    const date =
        new Date(
            year,
            month - 1,
            day
        );

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;

}


/* =============================================================
   TIME FORMATTER
   ============================================================= */

function formatEventTime(value) {

    if (!value) {
        return "";
    }

    const parts =
        String(value)
            .trim()
            .split(":");

    let hour =
        Number(parts[0]);

    const minuteNumber =
        Number(parts[1] || 0);

    if (
        Number.isNaN(hour) ||
        Number.isNaN(minuteNumber) ||
        hour < 0 ||
        hour > 23 ||
        minuteNumber < 0 ||
        minuteNumber > 59
    ) {
        return String(value);
    }

    const minute =
        String(minuteNumber)
            .padStart(2, "0");

    const period =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12;

    if (hour === 0) {
        hour = 12;
    }

    return `${hour}:${minute} ${period}`;

}


/* =============================================================
   SAFE IMAGE URL
   ============================================================= */

function safeImageUrl(value) {

    if (!value) {
        return "";
    }

    const imageUrl =
        String(value).trim();

    if (!imageUrl) {
        return "";
    }


    /* LOCAL WEBSITE IMAGE */

    if (
        imageUrl.startsWith("images/") ||
        imageUrl.startsWith("/firstnewzion/images/")
    ) {
        return imageUrl;
    }


    /* REMOTE HTTPS IMAGE */

    try {

        const url =
            new URL(
                imageUrl,
                window.location.href
            );

        if (url.protocol === "https:") {
            return url.href;
        }

    }
    catch (error) {

        return "";

    }

    return "";

}


/* =============================================================
   HTML SAFETY
   ============================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}




/* =============================================================
   PERSISTENT NAVIGATION: ALWAYS START DESTINATION AT TOP

   Main navigation is intentionally NOT scroll-restored.
   #top is authoritative for these links, including same-page clicks.
   ============================================================= */
(function initializePersistentNavTopLinks() {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    function forceTop() {
        window.scrollTo(0, 0);
    }

    document.querySelectorAll('.main-nav .nav-links a').forEach(link => {
        link.addEventListener('click', event => {
            const target = new URL(link.href, window.location.href);
            const current = new URL(window.location.href);

            if (target.pathname === current.pathname && target.hash === '#top') {
                event.preventDefault();
                history.replaceState(null, '', target.pathname + target.search + '#top');
                forceTop();
                requestAnimationFrame(forceTop);
                return;
            }

            sessionStorage.setItem('fnz-main-nav-force-top', 'true');
        });
    });

    window.addEventListener('pageshow', () => {
        const fromMainNav = sessionStorage.getItem('fnz-main-nav-force-top') === 'true';
        const hasTopHash = window.location.hash === '#top';

        if (fromMainNav || hasTopHash) {
            sessionStorage.removeItem('fnz-main-nav-force-top');
            forceTop();
            requestAnimationFrame(forceTop);
            setTimeout(forceTop, 0);
            setTimeout(forceTop, 100);
        }
    });
})();

/* =============================================================
   PUBLISHER-MANAGED SITE BRANDING
   Static files remain graceful fallbacks if the API is unavailable.
   ============================================================= */

async function initializeSiteBranding() {
    try {
        const response = await fetch(`${FNZ_API_URL}/api/site-settings`, {
            headers: { "Accept": "application/json" },
            cache: "no-store"
        });
        if (!response.ok) return;
        const data = await response.json();
        const logo = safeImageUrl(data?.settings?.church_logo);
        const hero = safeImageUrl(data?.settings?.hero_image);

        if (logo) {
            document.querySelectorAll(".brand-mark img").forEach(image => {
                image.src = logo;
            });
        }

        if (hero) {
            document.querySelectorAll(".hero-image").forEach(image => {
                image.src = hero;
            });
        }
    }
    catch (error) {
        console.warn("Publisher branding unavailable; using packaged site images.");
    }
}


/* =============================================================
   PUBLIC WORSHIP MEDIA GALLERY
   ============================================================= */

async function initializePublicMediaGallery() {
    const container = document.getElementById("public-media-gallery");
    if (!container) return;

    try {
        const response = await fetch(`${FNZ_API_URL}/api/gallery`, {
            headers: { "Accept": "application/json" },
            cache: "no-store"
        });
        if (!response.ok) throw new Error("Media request failed.");
        const data = await response.json();
        const items = Array.isArray(data?.items) ? data.items : [];

        if (!items.length) {
            container.innerHTML = `<div class="v2-cta"><h2>Media Gallery</h2><p>Approved church photos and videos will appear here as they are published.</p></div>`;
            return;
        }

        container.innerHTML = items.map(item => {
            const title = escapeHtml(item.title || (item.media_type === "video" ? "Church Video" : "Church Photo"));
            const caption = escapeHtml(item.caption || "");
            const mediaUrl = safeImageUrl(item.media_url);
            if (!mediaUrl) return "";

            const media = item.media_type === "video"
                ? `<video class="public-media-asset" src="${escapeAttribute(mediaUrl)}" controls preload="metadata"></video>`
                : `<img class="public-media-asset" src="${escapeAttribute(mediaUrl)}" alt="${escapeAttribute(title)}" loading="lazy">`;

            return `<article class="public-media-card">${media}<div class="public-media-copy"><h3>${title}</h3>${caption ? `<p>${caption}</p>` : ""}</div></article>`;
        }).join("");
    }
    catch (error) {
        container.innerHTML = `<div class="v2-cta"><h2>Media Gallery</h2><p>The gallery is temporarily unavailable. Please visit the church YouTube channel above.</p></div>`;
    }
}


/* =============================================================
   V2 LEADERSHIP DIRECTORY + PROFILE
   Public data only. Personal contact information is never used.
   ============================================================= */

async function loadLeadershipDirectory() {
    const container = document.getElementById("leadership-directory");
    if (!container) return;

    const pastorCard = `<article class="leadership-card leadership-card-pastor"><img class="leadership-card-image" src="images/Pastor_Sampson.png" alt="Rev. Dr. James B. Sampson"><h3>Rev. Dr. James B. Sampson</h3><p>Pastor</p><a href="leader.html?slug=pastor">VIEW PROFILE →</a></article>`;

    // Pastor Sampson remains the fallback baseline. Once a Publisher profile
    // for him exists, that database profile replaces the fallback card so
    // his photo and biography can be managed in the Publisher too.
    container.innerHTML = pastorCard;

    try {
        const response = await fetch(`${FNZ_API_URL}/api/leadership`);
        if (!response.ok) throw new Error("Leadership request failed.");

        const payload = await response.json();
        const leaders = Array.isArray(payload.leadership) ? payload.leadership : [];
        if (!leaders.length) return;

        const hasPublisherPastor = leaders.some(leader => {
            const name = [leader.first_name, leader.last_name].filter(Boolean).join(" ").toLowerCase();
            return name.includes("james b. sampson") || name.includes("james sampson");
        });

        const dynamicCards = leaders.map(leader => {
            const fullName = escapeHtml([leader.first_name, leader.last_name].filter(Boolean).join(" "));
            const image = leader.image_url
                ? `<img class="leadership-card-image" src="${escapeAttribute(leader.image_url)}" alt="${fullName}">`
                : `<div class="leadership-card-placeholder" aria-hidden="true">✦</div>`;

            return `<article class="leadership-card">${image}<h3>${fullName}</h3><p>${escapeHtml(leader.title || "")}</p><a href="leader.html?id=${encodeURIComponent(leader.id)}">VIEW PROFILE →</a></article>`;
        }).join("");

        container.innerHTML = hasPublisherPastor
            ? dynamicCards
            : pastorCard + dynamicCards;
    }
    catch (error) {
        console.warn("Leadership API unavailable; showing permanent pastor profile.");
    }
}

async function loadLeadershipProfile() {
    const container = document.getElementById("leader-profile");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const slug = params.get("slug");

    if (slug === "pastor" && !id) {
        container.innerHTML = `<article class="leadership-profile-card"><img class="leadership-profile-image" src="images/Pastor_Sampson.png" alt="Rev. Dr. James B. Sampson"><div class="leadership-profile-copy"><p class="eyebrow">PASTOR</p><h1>Rev. Dr. James B. Sampson</h1><p class="leader-title">Pastor, First New Zion Missionary Baptist Church</p><p class="leader-bio">An expanded, church-approved pastoral biography can be published here when provided.</p><a class="gold-button" href="leadership.html">← ALL LEADERSHIP</a></div></article>`;
        return;
    }

    if (!id) {
        container.innerHTML = `<div class="v2-card"><h2>Profile Not Found</h2><p>No leadership profile was selected.</p><a href="leadership.html">Return to Leadership →</a></div>`;
        return;
    }

    try {
        const response = await fetch(`${FNZ_API_URL}/api/leadership/${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error("Profile request failed.");
        const payload = await response.json();
        const leader = payload.leader;
        const fullName = escapeHtml([leader.first_name, leader.last_name].filter(Boolean).join(" "));
        const image = leader.image_url
            ? `<img class="leadership-profile-image" src="${escapeAttribute(leader.image_url)}" alt="${fullName}">`
            : `<div class="leadership-card-placeholder" aria-hidden="true">✦</div>`;

        document.title = `${fullName} | First New Zion`;
        container.innerHTML = `<article class="leadership-profile-card">${image}<div class="leadership-profile-copy"><p class="eyebrow">FIRST NEW ZION LEADERSHIP</p><h1>${fullName}</h1><p class="leader-title">${escapeHtml(leader.title || "")}</p><p class="leader-bio">${escapeHtml(leader.biography || "Profile information will be added as it is approved.")}</p><a class="gold-button" href="leadership.html">← ALL LEADERSHIP</a></div></article>`;
    }
    catch (error) {
        container.innerHTML = `<div class="v2-card"><h2>Profile Not Available</h2><p>This profile could not be loaded.</p><a href="leadership.html">Return to Leadership →</a></div>`;
    }
}


/* =============================================================
   FNZ DIRECTIONS
   Apple devices open Apple Maps; other devices open Google Maps.
   The visitor's map app supplies the starting location.
   ============================================================= */
function initializeDirectionsLinks() {
    const isApple = /Macintosh|Mac OS X|iPhone|iPad|iPod/i.test(navigator.userAgent);
    document.querySelectorAll(".fnz-directions[data-address]").forEach(link => {
        const address = encodeURIComponent(link.dataset.address);
        link.href = isApple
            ? `https://maps.apple.com/?daddr=${address}&dirflg=d`
            : `https://www.google.com/maps/dir/?api=1&destination=${address}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
    });
}
function initializeMinistryDetail() {
    const heading = document.getElementById("ministry-name");
    if (!heading) return;
    const name = new URLSearchParams(window.location.search).get("name");
    if (name) {
        heading.textContent = name;
        document.title = `${name} | First New Zion`;
    }
}

function escapeAttribute(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

document.addEventListener("DOMContentLoaded", () => {
    loadLeadershipDirectory();
    loadLeadershipProfile();
    initializeDirectionsLinks();
    initializeMinistryDetail();
});


/* =============================================================
   V2.5 FINAL NAV-TOP OVERRIDE
   ?navtop=1 makes a persistent-nav click an explicit new navigation
   state so browser scroll restoration cannot reuse the last view.
   ============================================================= */
(function fnzFinalNavTopOverride() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('navtop')) return;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const top = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    top();
    document.addEventListener('DOMContentLoaded', top, { once: true });
    window.addEventListener('load', top, { once: true });
    window.addEventListener('pageshow', top, { once: true });
    requestAnimationFrame(() => requestAnimationFrame(top));
    setTimeout(top, 0);
    setTimeout(top, 50);
    setTimeout(top, 250);
})();
