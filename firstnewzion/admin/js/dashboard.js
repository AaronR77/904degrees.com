"use strict";

/*
 * First New Zion Missionary Baptist Church
 * Website Publisher
 * Dashboard Controller
 */


const API_URL =
    "https://fnz-website-api.904degreeslabs.workers.dev";


document.addEventListener("DOMContentLoaded", () => {

    const LOGIN_PAGE = "index.html";


    /* =========================================================
       SESSION
       ========================================================= */

    const storedUser =
        sessionStorage.getItem(
            "fnzPublisherUser"
        );

    const storedToken =
        sessionStorage.getItem(
            "fnzPublisherToken"
        );


    if (!storedToken) {

        window.location.href =
            LOGIN_PAGE;

        return;
    }


    let currentUser = null;


    if (storedUser) {

        try {

            currentUser =
                JSON.parse(
                    storedUser
                );

        }
        catch (error) {

            console.warn(
                "Unable to read Publisher user data."
            );
        }
    }


    /* =========================================================
       USER DISPLAY
       ========================================================= */

    const userDisplayName =
        document.getElementById(
            "user-display-name"
        );

    const welcomeName =
        document.getElementById(
            "welcome-name"
        );


    if (currentUser) {

        const firstName =
            currentUser.first_name ||
            currentUser.firstName ||
            currentUser.name ||
            "Administrator";


        if (userDisplayName) {

            userDisplayName.textContent =
                firstName;
        }


        if (welcomeName) {

            welcomeName.textContent =
                firstName;
        }
    }


    /* =========================================================
       DASHBOARD NAVIGATION
       ========================================================= */

    const navButtons =
        document.querySelectorAll(
            ".publisher-nav-button"
        );

    const panels =
        document.querySelectorAll(
            ".publisher-panel"
        );


    function openPanel(panelName) {

        panels.forEach(panel => {

            panel.classList.remove(
                "active"
            );
        });


        navButtons.forEach(button => {

            button.classList.remove(
                "active"
            );
        });


        const targetPanel =
            document.getElementById(
                `panel-${panelName}`
            );

        const targetButton =
            document.querySelector(
                `.publisher-nav-button[data-panel="${panelName}"]`
            );


        if (targetPanel) {

            targetPanel.classList.add(
                "active"
            );
        }


        if (targetButton) {

            targetButton.classList.add(
                "active"
            );
        }


        if (panelName === "events") {
            loadEvents();
        }

        if (panelName === "leadership") {
            loadLeadership();
        }


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    navButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const panelName =
                    button.dataset.panel;


                if (panelName) {

                    openPanel(
                        panelName
                    );
                }
            }
        );
    });


    /* =========================================================
       OVERVIEW CARDS
       ========================================================= */

    const dashboardCards =
        document.querySelectorAll(
            "[data-open-panel]"
        );


    dashboardCards.forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const panelName =
                    card.dataset.openPanel;


                if (panelName) {

                    openPanel(
                        panelName
                    );
                }
            }
        );
    });


    /* =========================================================
       ROLE DISPLAY
       ========================================================= */

    let role =
        "administrator";


    if (currentUser) {

        role = (
            currentUser.role ||
            currentUser.system_role ||
            currentUser.publisher_role ||
            "administrator"
        ).toLowerCase();
    }


    const adminOnlyElements =
        document.querySelectorAll(
            ".admin-only"
        );


    if (
        role !== "administrator" &&
        role !== "admin" &&
        role !== "owner"
    ) {

        adminOnlyElements.forEach(
            element => {

                element.hidden =
                    true;
            }
        );
    }


    /* =========================================================
       SIGN OUT
       ========================================================= */

    const logoutButton =
        document.getElementById(
            "logout-button"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                try {

                    await fetch(
                        `${API_URL}/api/auth/logout`,
                        {
                            method: "POST",

                            headers: {
                                "Authorization":
                                    `Bearer ${storedToken}`
                            }
                        }
                    );

                }
                catch (error) {

                    console.warn(
                        "Server logout failed. Local session will still be cleared."
                    );
                }


                sessionStorage.removeItem(
                    "fnzPublisherUser"
                );

                sessionStorage.removeItem(
                    "fnzPublisherToken"
                );

                sessionStorage.removeItem(
                    "fnzEventPreview"
                );


                window.location.href =
                    LOGIN_PAGE;
            }
        );
    }


    /* =========================================================
       EVENTS — ELEMENTS
       ========================================================= */

    const addEventButton =
        document.getElementById(
            "add-event-button"
        );

    const eventEditor =
        document.getElementById(
            "event-editor"
        );

    const closeEventEditorButton =
        document.getElementById(
            "close-event-editor"
        );

    const eventEditorTitle =
        document.getElementById(
            "event-editor-title"
        );

    const eventEditorStatus =
        document.getElementById(
            "event-editor-status"
        );

    const eventEditorStatusText =
        document.getElementById(
            "event-editor-status-text"
        );

    const eventForm =
        document.getElementById(
            "event-form"
        );

    const eventId =
        document.getElementById(
            "event-id"
        );

    const eventTitle =
        document.getElementById(
            "event-title"
        );

    const eventDate =
        document.getElementById(
            "event-date"
        );

    const eventEndDate =
        document.getElementById(
            "event-end-date"
        );

    const eventTime =
        document.getElementById(
            "event-time"
        );

    const eventLocation =
        document.getElementById(
            "event-location"
        );

    const eventDescription =
        document.getElementById(
            "event-description"
        );

    const eventImageUrl =
        document.getElementById(
            "event-image-url"
        );

    const eventFormMessage =
        document.getElementById(
            "event-form-message"
        );

    const previewEventButton =
        document.getElementById(
            "preview-event-button"
        );

    const saveDraftButton =
        document.getElementById(
            "save-draft-button"
        );

    const publishEventButton =
        document.getElementById(
            "publish-event-button"
        );

    const unpublishEventButton =
        document.getElementById(
            "unpublish-event-button"
        );

    const eventsLoading =
        document.getElementById(
            "events-loading"
        );

    const eventsEmpty =
        document.getElementById(
            "events-empty"
        );

    const eventsList =
        document.getElementById(
            "events-list"
        );


    let eventCache = [];

    let currentEditorPublished =
        false;


    /* =========================================================
       EVENTS — API HELPER
       ========================================================= */

    async function apiRequest(
        path,
        options = {}
    ) {

        const headers = {
            ...(options.headers || {})
        };


        headers.Authorization =
            `Bearer ${storedToken}`;


        if (
            options.body &&
            !headers["Content-Type"]
        ) {

            headers["Content-Type"] =
                "application/json";
        }


        const response =
            await fetch(
                `${API_URL}${path}`,
                {
                    ...options,
                    headers
                }
            );


        let data = {};


        try {

            data =
                await response.json();

        }
        catch (error) {

            data = {};
        }


        if (response.status === 401) {

            sessionStorage.removeItem(
                "fnzPublisherUser"
            );

            sessionStorage.removeItem(
                "fnzPublisherToken"
            );

            sessionStorage.removeItem(
                "fnzEventPreview"
            );


            window.location.href =
                LOGIN_PAGE;


            throw new Error(
                "Your Publisher session has expired."
            );
        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Publisher request failed."
            );
        }


        return data;
    }


    /* =========================================================
       EVENTS — LOAD
       ========================================================= */

    async function loadEvents() {

        if (
            !eventsLoading ||
            !eventsEmpty ||
            !eventsList
        ) {

            return;
        }


        eventsLoading.hidden =
            false;

        eventsEmpty.hidden =
            true;

        eventsList.hidden =
            true;


        try {

            const data =
                await apiRequest(
                    "/api/events"
                );


            eventCache =
                Array.isArray(
                    data.events
                )
                    ? data.events
                    : [];


            renderEvents();

        }
        catch (error) {

            console.error(
                "Unable to load events:",
                error
            );


            eventsLoading.hidden =
                true;

            eventsEmpty.hidden =
                false;

            eventsList.hidden =
                true;


            eventsEmpty.innerHTML = `
                <h2>
                    Unable to Load Events
                </h2>

                <p>
                    ${escapeHtml(error.message)}
                </p>
            `;
        }
    }


    /* =========================================================
       EVENTS — RENDER
       ========================================================= */

    function renderEvents() {

        eventsLoading.hidden =
            true;


        if (eventCache.length === 0) {

            eventsList.innerHTML =
                "";

            eventsList.hidden =
                true;

            eventsEmpty.hidden =
                false;


            eventsEmpty.innerHTML = `
                <h2>
                    No Events Yet
                </h2>

                <p>
                    Select Add Event to create the first
                    church event or announcement.
                </p>
            `;


            return;
        }


        eventsEmpty.hidden =
            true;

        eventsList.hidden =
            false;


        eventsList.innerHTML =
            eventCache
                .map(
                    createEventCard
                )
                .join("");
    }


    function createEventCard(event) {

        const dateParts =
            formatEventDate(
                event.event_date
            );


        const status =
            Number(
                event.is_published
            ) === 1
                ? "Published"
                : "Draft";


        const statusClass =
            Number(
                event.is_published
            ) === 1
                ? "published"
                : "draft";


        const time =
            formatEventTime(
                event.event_time
            );


        const description =
            event.description
                ? escapeHtml(
                    event.description
                )
                : "No description provided.";


        const location =
            event.location
                ? escapeHtml(
                    event.location
                )
                : "";


        const dateRange =
            formatAdminDateRange(
                event.event_date,
                event.end_date
            );


        return `
            <article class="event-admin-card">

                <div class="event-admin-date">

                    <strong>
                        ${dateParts.month}
                    </strong>

                    <span>
                        ${dateParts.day}
                    </span>

                </div>


                <div class="event-admin-content">

                    <div class="event-admin-title-row">

                        <div>

                            <span class="event-status ${statusClass}">
                                ${status}
                            </span>

                            <h2>
                                ${escapeHtml(event.title)}
                            </h2>

                        </div>

                    </div>


                    <div class="event-admin-meta">

                        ${dateRange
                ? `<span>${escapeHtml(dateRange)}</span>`
                : ""
            }

                        ${time
                ? `<span>${escapeHtml(time)}</span>`
                : ""
            }

                        ${location
                ? `<span>${location}</span>`
                : ""
            }

                    </div>


                    <p>
                        ${description}
                    </p>


                    <div class="event-admin-actions">

                        <button
                            class="publisher-secondary-button"
                            type="button"
                            data-event-action="edit"
                            data-event-id="${event.id}">
                            EDIT
                        </button>

                        <button
                            class="publisher-secondary-button"
                            type="button"
                            data-event-action="preview"
                            data-event-id="${event.id}">
                            PREVIEW
                        </button>

                        <button
                            class="publisher-danger-button"
                            type="button"
                            data-event-action="delete"
                            data-event-id="${event.id}">
                            DELETE
                        </button>

                    </div>

                </div>

            </article>
        `;
    }


    /* =========================================================
       EVENTS — EDITOR STATUS
       ========================================================= */

    function updateEditorStatus(
        isPublished,
        isExisting
    ) {

        currentEditorPublished =
            Boolean(
                isPublished
            );


        if (
            eventEditorStatus &&
            eventEditorStatusText
        ) {

            eventEditorStatus.hidden =
                false;


            eventEditorStatusText.textContent =
                currentEditorPublished
                    ? "PUBLISHED"
                    : "DRAFT";
        }


        if (saveDraftButton) {

            /*
             * A published event should not accidentally be
             * converted to draft by a button named Save Draft.
             *
             * Published events instead use:
             *
             * SAVE CHANGES
             * UNPUBLISH
             */

            saveDraftButton.hidden =
                currentEditorPublished;
        }


        if (unpublishEventButton) {

            unpublishEventButton.hidden =
                !(
                    isExisting &&
                    currentEditorPublished
                );
        }


        if (publishEventButton) {

            publishEventButton.textContent =
                currentEditorPublished
                    ? "SAVE CHANGES"
                    : "PUBLISH EVENT";
        }
    }


    /* =========================================================
       EVENTS — OPEN NEW EVENT
       ========================================================= */

    function openNewEventEditor() {

        if (
            !eventEditor ||
            !eventForm
        ) {

            return;
        }


        eventForm.reset();


        eventId.value =
            "";


        if (eventEndDate) {

            eventEndDate.value =
                "";
        }


        eventEditorTitle.textContent =
            "Add Event";


        eventFormMessage.textContent =
            "";


        updateEditorStatus(
            false,
            false
        );


        eventEditor.hidden =
            false;


        eventEditor.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        eventTitle.focus();
    }


    /* =========================================================
       EVENTS — OPEN EXISTING EVENT
       ========================================================= */

    function openExistingEvent(
        selectedEvent
    ) {

        if (
            !selectedEvent ||
            !eventEditor
        ) {

            return;
        }


        eventId.value =
            selectedEvent.id;


        eventTitle.value =
            selectedEvent.title ||
            "";


        eventDate.value =
            selectedEvent.event_date ||
            "";


        if (eventEndDate) {

            eventEndDate.value =
                selectedEvent.end_date ||
                "";
        }


        eventTime.value =
            selectedEvent.event_time ||
            "";


        eventLocation.value =
            selectedEvent.location ||
            "";


        eventDescription.value =
            selectedEvent.description ||
            "";


        eventImageUrl.value =
            selectedEvent.image_url ||
            "";


        eventEditorTitle.textContent =
            "Edit Event";


        eventFormMessage.textContent =
            "";


        updateEditorStatus(
            Number(
                selectedEvent.is_published
            ) === 1,
            true
        );


        eventEditor.hidden =
            false;


        eventEditor.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }


    /* =========================================================
       EVENTS — CLOSE EDITOR
       ========================================================= */

    function closeEventEditor() {

        if (!eventEditor) {

            return;
        }


        eventEditor.hidden =
            true;


        if (eventForm) {

            eventForm.reset();
        }


        if (eventId) {

            eventId.value =
                "";
        }


        if (eventFormMessage) {

            eventFormMessage.textContent =
                "";
        }


        currentEditorPublished =
            false;
    }


    /* =========================================================
       EVENTS — FORM DATA
       ========================================================= */

    function collectEventFormData(
        publishState
    ) {

        return {

            title:
                eventTitle.value.trim(),

            event_date:
                eventDate.value,

            /*
             * Worker/D1 support for this field is the NEXT step.
             */

            end_date:
                eventEndDate
                    ? eventEndDate.value || ""
                    : "",

            event_time:
                eventTime.value || "",

            location:
                eventLocation.value.trim(),

            description:
                eventDescription.value.trim(),

            image_url:
                eventImageUrl.value.trim(),

            is_published:
                publishState
                    ? 1
                    : 0
        };
    }


    /* =========================================================
       EVENTS — VALIDATION
       ========================================================= */

    function validateEventData(
        formData
    ) {

        if (!formData.title) {

            eventFormMessage.textContent =
                "Event title is required.";

            eventTitle.focus();

            return false;
        }


        if (!formData.event_date) {

            eventFormMessage.textContent =
                "Start date is required.";

            eventDate.focus();

            return false;
        }


        if (
            formData.end_date &&
            formData.end_date <
            formData.event_date
        ) {

            eventFormMessage.textContent =
                "End date cannot be before the start date.";


            if (eventEndDate) {

                eventEndDate.focus();
            }


            return false;
        }


        return true;
    }


    /* =========================================================
       EVENTS — SAVE CORE
       ========================================================= */

    async function saveEventWithState(
        publishState,
        actionButton,
        successMessage
    ) {

        const formData =
            collectEventFormData(
                publishState
            );


        if (
            !validateEventData(
                formData
            )
        ) {

            return;
        }


        const existingId =
            eventId.value.trim();


        const originalButtonText =
            actionButton
                ? actionButton.textContent
                : "";


        if (actionButton) {

            actionButton.disabled =
                true;

            actionButton.textContent =
                publishState
                    ? "PUBLISHING..."
                    : "SAVING...";
        }


        disableEventActionButtons(
            actionButton
        );


        eventFormMessage.textContent =
            publishState
                ? "Publishing event..."
                : "Saving draft...";


        try {

            let data;


            if (existingId) {

                data =
                    await apiRequest(
                        `/api/events/${encodeURIComponent(existingId)}`,
                        {
                            method: "PUT",

                            body:
                                JSON.stringify(
                                    formData
                                )
                        }
                    );

            }
            else {

                data =
                    await apiRequest(
                        "/api/events",
                        {
                            method: "POST",

                            body:
                                JSON.stringify(
                                    formData
                                )
                        }
                    );
            }


            eventFormMessage.textContent =
                successMessage ||
                data.message ||
                "Event saved.";


            await loadEvents();


            window.setTimeout(
                () => {

                    closeEventEditor();

                },
                500
            );

        }
        catch (error) {

            console.error(
                "Unable to save event:",
                error
            );


            eventFormMessage.textContent =
                error.message ||
                "Unable to save event.";
        }
        finally {

            enableEventActionButtons();


            if (actionButton) {

                actionButton.textContent =
                    originalButtonText;
            }
        }
    }


    /* =========================================================
       EVENTS — BUTTON LOCKING
       ========================================================= */

    function disableEventActionButtons(
        activeButton
    ) {

        const buttons = [
            previewEventButton,
            saveDraftButton,
            publishEventButton,
            unpublishEventButton
        ];


        buttons.forEach(button => {

            if (
                button &&
                button !== activeButton
            ) {

                button.disabled =
                    true;
            }
        });
    }


    function enableEventActionButtons() {

        const buttons = [
            previewEventButton,
            saveDraftButton,
            publishEventButton,
            unpublishEventButton
        ];


        buttons.forEach(button => {

            if (button) {

                button.disabled =
                    false;
            }
        });
    }


    /* =========================================================
       EVENTS — SAVE DRAFT
       ========================================================= */

    async function saveDraft() {

        await saveEventWithState(
            false,
            saveDraftButton,
            "Draft saved."
        );
    }


    /* =========================================================
       EVENTS — PUBLISH / SAVE CHANGES
       ========================================================= */

    async function publishEvent() {

        const successMessage =
            currentEditorPublished
                ? "Published event updated."
                : "Event published.";


        await saveEventWithState(
            true,
            publishEventButton,
            successMessage
        );
    }


    /* =========================================================
       EVENTS — UNPUBLISH
       ========================================================= */

    async function unpublishEvent() {

        const existingId =
            eventId.value.trim();


        if (!existingId) {

            return;
        }


        const confirmed =
            window.confirm(
                "Remove this event from the public website?\n\nThe event will remain saved as a draft."
            );


        if (!confirmed) {

            return;
        }


        const formData =
            collectEventFormData(
                false
            );


        if (
            !validateEventData(
                formData
            )
        ) {

            return;
        }


        const originalText =
            unpublishEventButton
                ? unpublishEventButton.textContent
                : "UNPUBLISH";


        if (unpublishEventButton) {

            unpublishEventButton.disabled =
                true;

            unpublishEventButton.textContent =
                "UNPUBLISHING...";
        }


        disableEventActionButtons(
            unpublishEventButton
        );


        eventFormMessage.textContent =
            "Removing event from the public website...";


        try {

            const data =
                await apiRequest(
                    `/api/events/${encodeURIComponent(existingId)}`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify(
                                formData
                            )
                    }
                );


            eventFormMessage.textContent =
                data.message ||
                "Event unpublished and saved as draft.";


            await loadEvents();


            window.setTimeout(
                () => {

                    closeEventEditor();

                },
                500
            );

        }
        catch (error) {

            console.error(
                "Unable to unpublish event:",
                error
            );


            eventFormMessage.textContent =
                error.message ||
                "Unable to unpublish event.";
        }
        finally {

            enableEventActionButtons();


            if (unpublishEventButton) {

                unpublishEventButton.textContent =
                    originalText;
            }
        }
    }


    /* =========================================================
       EVENTS — PREVIEW
       ========================================================= */

    function previewEvent(
        previewData
    ) {

        if (!previewData) {

            return;
        }


        if (
            !previewData.title ||
            !previewData.event_date
        ) {

            if (eventFormMessage) {

                eventFormMessage.textContent =
                    "Event title and start date are required for preview.";
            }


            return;
        }


        sessionStorage.setItem(
            "fnzEventPreview",
            JSON.stringify(
                previewData
            )
        );


        window.open(
            "../events.html?preview=1",
            "_blank"
        );
    }


    /* =========================================================
       EVENTS — DELETE
       ========================================================= */

    async function removeEvent(
        selectedEvent
    ) {

        if (!selectedEvent) {

            return;
        }


        const confirmed =
            window.confirm(
                `Delete "${selectedEvent.title}"?\n\nThis cannot be undone.`
            );


        if (!confirmed) {

            return;
        }


        try {

            await apiRequest(
                `/api/events/${encodeURIComponent(selectedEvent.id)}`,
                {
                    method: "DELETE"
                }
            );


            if (
                String(eventId.value) ===
                String(selectedEvent.id)
            ) {

                closeEventEditor();
            }


            await loadEvents();

        }
        catch (error) {

            console.error(
                "Unable to delete event:",
                error
            );


            window.alert(
                error.message ||
                "Unable to delete event."
            );
        }
    }


    /* =========================================================
       EVENTS — BUTTON HANDLERS
       ========================================================= */

    if (addEventButton) {

        addEventButton.addEventListener(
            "click",
            openNewEventEditor
        );
    }


    if (closeEventEditorButton) {

        closeEventEditorButton.addEventListener(
            "click",
            closeEventEditor
        );
    }


    /*
     * Prevent Enter inside the form from causing an accidental
     * publish/draft action. Publishing is now an explicit choice.
     */

    if (eventForm) {

        eventForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();
            }
        );
    }


    if (saveDraftButton) {

        saveDraftButton.addEventListener(
            "click",
            saveDraft
        );
    }


    if (publishEventButton) {

        publishEventButton.addEventListener(
            "click",
            publishEvent
        );
    }


    if (unpublishEventButton) {

        unpublishEventButton.addEventListener(
            "click",
            unpublishEvent
        );
    }


    if (previewEventButton) {

        previewEventButton.addEventListener(
            "click",
            () => {

                const previewData =
                    collectEventFormData(
                        currentEditorPublished
                    );


                if (!previewData.title) {

                    eventFormMessage.textContent =
                        "Enter an event title before previewing.";

                    eventTitle.focus();

                    return;
                }


                if (!previewData.event_date) {

                    eventFormMessage.textContent =
                        "Select a start date before previewing.";

                    eventDate.focus();

                    return;
                }


                if (
                    previewData.end_date &&
                    previewData.end_date <
                    previewData.event_date
                ) {

                    eventFormMessage.textContent =
                        "End date cannot be before the start date.";


                    if (eventEndDate) {

                        eventEndDate.focus();
                    }


                    return;
                }


                previewEvent(
                    previewData
                );
            }
        );
    }


    if (eventsList) {

        eventsList.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-event-action]"
                    );


                if (!button) {

                    return;
                }


                const selectedEvent =
                    eventCache.find(
                        item =>
                            String(item.id) ===
                            String(
                                button.dataset.eventId
                            )
                    );


                if (!selectedEvent) {

                    return;
                }


                const action =
                    button.dataset.eventAction;


                if (action === "edit") {

                    openExistingEvent(
                        selectedEvent
                    );

                    return;
                }


                if (action === "preview") {

                    previewEvent({

                        title:
                            selectedEvent.title,

                        event_date:
                            selectedEvent.event_date,

                        end_date:
                            selectedEvent.end_date ||
                            "",

                        event_time:
                            selectedEvent.event_time ||
                            "",

                        location:
                            selectedEvent.location ||
                            "",

                        description:
                            selectedEvent.description ||
                            "",

                        image_url:
                            selectedEvent.image_url ||
                            "",

                        is_published:
                            Number(
                                selectedEvent.is_published
                            )
                    });


                    return;
                }


                if (action === "delete") {

                    removeEvent(
                        selectedEvent
                    );
                }
            }
        );
    }


    /* =========================================================
       LEADERSHIP — PUBLISHER CRUD
       Public profile information only. No personal contact data.
       ========================================================= */

    const leadershipEditor = document.getElementById("leadership-editor");
    const leadershipForm = document.getElementById("leader-form");
    const leadershipLoading = document.getElementById("leadership-loading");
    const leadershipEmpty = document.getElementById("leadership-empty");
    const leadershipList = document.getElementById("leadership-list");
    let leadershipCache = [];

    async function loadLeadership() {
        if (!leadershipList) return;
        leadershipLoading.hidden = false;
        leadershipEmpty.hidden = true;
        leadershipList.hidden = true;

        try {
            const data = await apiRequest("/api/leadership");
            leadershipCache = Array.isArray(data.leadership) ? data.leadership : [];
            leadershipLoading.hidden = true;

            if (!leadershipCache.length) {
                leadershipEmpty.hidden = false;
                return;
            }

            leadershipList.innerHTML = leadershipCache.map(leader => {
                const fullName = escapeHtml([leader.first_name, leader.last_name].filter(Boolean).join(" "));
                const status = Number(leader.is_visible) === 1 ? "Published" : "Draft";
                return `<article class="leadership-publisher-card" data-leader-id="${leader.id}"><div><span class="event-status ${Number(leader.is_visible) === 1 ? "published" : "draft"}">${status}</span><h3>${fullName}</h3><p>${escapeHtml(leader.title || "")}</p></div><div class="event-card-actions"><button type="button" data-leader-action="edit">EDIT</button><button type="button" data-leader-action="preview">PREVIEW</button><button type="button" class="delete-button" data-leader-action="delete">DELETE</button></div></article>`;
            }).join("");
            leadershipList.hidden = false;
        }
        catch (error) {
            leadershipLoading.hidden = true;
            leadershipEmpty.hidden = false;
            leadershipEmpty.querySelector("h2").textContent = "Leadership Unavailable";
            leadershipEmpty.querySelector("p").textContent = error.message || "Unable to load leadership profiles.";
        }
    }

    function openLeaderEditor(leader = null) {
        leadershipForm.reset();
        document.getElementById("leader-id").value = leader?.id || "";
        document.getElementById("leader-first-name").value = leader?.first_name || "";
        document.getElementById("leader-last-name").value = leader?.last_name || "";
        document.getElementById("leader-title").value = leader?.title || "";
        document.getElementById("leader-biography").value = leader?.biography || "";
        document.getElementById("leader-image-url").value = leader?.image_url || "";
        document.getElementById("leader-display-order").value = leader?.display_order ?? 0;
        document.getElementById("leader-visible").checked = leader ? Number(leader.is_visible) === 1 : true;
        document.getElementById("leader-editor-title").textContent = leader ? "Edit Profile" : "Add Profile";
        leadershipEditor.hidden = false;
        leadershipEditor.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function getLeaderFormData() {
        return {
            first_name: document.getElementById("leader-first-name").value.trim(),
            last_name: document.getElementById("leader-last-name").value.trim(),
            title: document.getElementById("leader-title").value.trim(),
            biography: document.getElementById("leader-biography").value.trim(),
            image_url: document.getElementById("leader-image-url").value.trim(),
            display_order: Number(document.getElementById("leader-display-order").value || 0),
            is_visible: document.getElementById("leader-visible").checked
        };
    }

    document.getElementById("add-leader-button")?.addEventListener("click", () => openLeaderEditor());
    document.getElementById("cancel-leader-button")?.addEventListener("click", () => { leadershipEditor.hidden = true; });

    leadershipForm?.addEventListener("submit", async event => {
        event.preventDefault();
        const id = document.getElementById("leader-id").value;
        const payload = getLeaderFormData();
        try {
            await apiRequest(id ? `/api/leadership/${id}` : "/api/leadership", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
            leadershipEditor.hidden = true;
            await loadLeadership();
        }
        catch (error) {
            alert(error.message || "Unable to save leadership profile.");
        }
    });

    document.getElementById("preview-leader-button")?.addEventListener("click", () => {
        const id = document.getElementById("leader-id").value;
        if (id) window.open(`../leader.html?id=${encodeURIComponent(id)}`, "_blank", "noopener");
        else alert("Save the profile once before opening its public preview.");
    });

    leadershipList?.addEventListener("click", async event => {
        const button = event.target.closest("[data-leader-action]");
        if (!button) return;
        const card = button.closest("[data-leader-id]");
        const id = card?.dataset.leaderId;
        const leader = leadershipCache.find(item => String(item.id) === String(id));
        if (!leader) return;

        const action = button.dataset.leaderAction;
        if (action === "edit") openLeaderEditor(leader);
        if (action === "preview") window.open(`../leader.html?id=${encodeURIComponent(id)}`, "_blank", "noopener");
        if (action === "delete") {
            const name = [leader.first_name, leader.last_name].filter(Boolean).join(" ");
            if (!confirm(`Delete ${name}'s leadership profile? This cannot be undone.`)) return;
            try {
                await apiRequest(`/api/leadership/${id}`, { method: "DELETE" });
                await loadLeadership();
            }
            catch (error) {
                alert(error.message || "Unable to delete leadership profile.");
            }
        }
    });

    /* =========================================================
       STARTUP
       ========================================================= */

    loadEvents();


    console.log(
        "First New Zion Website Publisher dashboard ready."
    );

});


/* =============================================================
   HTML SAFETY
   ============================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
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
   EVENT DATE FORMATTING
   ============================================================= */

function formatEventDate(
    dateValue
) {

    if (!dateValue) {

        return {
            month: "",
            day: ""
        };
    }


    const date =
        parseLocalDate(
            dateValue
        );


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
    };
}


/* =============================================================
   ADMIN DATE RANGE
   ============================================================= */

function formatAdminDateRange(
    startValue,
    endValue
) {

    const start =
        parseLocalDate(
            startValue
        );


    if (!start) {

        return "";
    }


    const end =
        parseLocalDate(
            endValue
        );


    if (
        !end ||
        start.getTime() ===
        end.getTime()
    ) {

        return start.toLocaleDateString(
            "en-US",
            {
                weekday: "short",
                month: "short",
                day: "numeric"
            }
        );
    }


    const sameMonth =
        start.getFullYear() ===
        end.getFullYear() &&
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


        return `${month} ${start.getDate()} – ${end.getDate()}`;
    }


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


    return `${startText} – ${endText}`;
}


/* =============================================================
   LOCAL DATE PARSER
   ============================================================= */

function parseLocalDate(
    dateValue
) {

    if (!dateValue) {

        return null;
    }


    const parts =
        String(
            dateValue
        ).split("-");


    if (parts.length !== 3) {

        return null;
    }


    const year =
        Number(
            parts[0]
        );

    const month =
        Number(
            parts[1]
        );

    const day =
        Number(
            parts[2]
        );


    if (
        Number.isNaN(year) ||
        Number.isNaN(month) ||
        Number.isNaN(day)
    ) {

        return null;
    }


    return new Date(
        year,
        month - 1,
        day
    );
}


/* =============================================================
   EVENT TIME FORMATTING
   ============================================================= */

function formatEventTime(
    timeValue
) {

    if (!timeValue) {

        return "";
    }


    const parts =
        String(
            timeValue
        ).split(":");


    let hour =
        Number(
            parts[0]
        );


    const minute =
        String(
            parts[1] ||
            "00"
        ).padStart(
            2,
            "0"
        );


    if (
        Number.isNaN(hour) ||
        hour < 0 ||
        hour > 23
    ) {

        return String(
            timeValue
        );
    }


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