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

        if (panelName === "ministries") {
            loadMinistries();
        }

        if (panelName === "gallery") {
            loadGallery();
        }

        if (panelName === "branding") {
            loadBranding();
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

    const eventAllDay =
        document.getElementById(
            "event-all-day"
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

    const eventImageDropzone =
        document.getElementById(
            "event-image-dropzone"
        );

    const eventImageFile =
        document.getElementById(
            "event-image-file"
        );

    const eventImagePreview =
        document.getElementById(
            "event-image-preview"
        );

    const removeEventImageButton =
        document.getElementById(
            "remove-event-image-button"
        );

    let pendingEventImageFile = null;
    let removeEventImageRequested = false;
    let eventImagePreviewObjectUrl = "";

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


    async function apiBinaryRequest(path, file, method = "PUT") {
        const response = await fetch(`${API_URL}${path}`, {
            method,
            headers: {
                "Authorization": `Bearer ${storedToken}`,
                "Content-Type": file.type || "application/octet-stream"
            },
            body: file
        });

        let data = {};
        try { data = await response.json(); } catch (error) { data = {}; }

        if (response.status === 401) {
            sessionStorage.removeItem("fnzPublisherUser");
            sessionStorage.removeItem("fnzPublisherToken");
            sessionStorage.removeItem("fnzEventPreview");
            window.location.href = LOGIN_PAGE;
            throw new Error("Your Publisher session has expired.");
        }

        if (!response.ok) {
            throw new Error(data.error || "Upload failed.");
        }

        return data;
    }


    async function apiFormRequest(path, formData) {
        const response = await fetch(`${API_URL}${path}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${storedToken}`
            },
            body: formData
        });

        let data = {};
        try { data = await response.json(); } catch (error) { data = {}; }

        if (response.status === 401) {
            sessionStorage.removeItem("fnzPublisherUser");
            sessionStorage.removeItem("fnzPublisherToken");
            sessionStorage.removeItem("fnzEventPreview");
            window.location.href = LOGIN_PAGE;
            throw new Error("Your Publisher session has expired.");
        }

        if (!response.ok) {
            throw new Error(data.error || "Upload failed.");
        }

        return data;
    }


    function wireFileDropzone(zone, input, onFile) {
        if (!zone || !input || !onFile) return;

        const choose = () => input.click();
        zone.addEventListener("click", choose);
        zone.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                choose();
            }
        });

        ["dragenter", "dragover"].forEach(type => {
            zone.addEventListener(type, event => {
                event.preventDefault();
                zone.classList.add("drag-over");
            });
        });

        ["dragleave", "drop"].forEach(type => {
            zone.addEventListener(type, event => {
                event.preventDefault();
                zone.classList.remove("drag-over");
            });
        });

        zone.addEventListener("drop", event => {
            const file = event.dataTransfer?.files?.[0];
            if (file) onFile(file);
        });

        input.addEventListener("change", () => {
            const file = input.files?.[0];
            if (file) onFile(file);
            input.value = "";
        });
    }


    function validateImageFile(file, maxMegabytes = 12) {
        const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
        if (!file || !allowed.has(file.type)) {
            throw new Error("Choose a JPG, PNG or WebP image.");
        }
        if (file.size > maxMegabytes * 1024 * 1024) {
            throw new Error(`Image must be ${maxMegabytes} MB or smaller.`);
        }
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
            Number(event.is_all_day) === 1
                ? "All Day"
                : formatEventTime(
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


    function syncEventAllDayState() {
        if (!eventAllDay || !eventTime) return;
        if (eventAllDay.checked) {
            eventTime.value = "";
            eventTime.disabled = true;
        }
        else {
            eventTime.disabled = false;
        }
    }


    function setEventImageState(url = "") {
        pendingEventImageFile = null;
        removeEventImageRequested = false;

        if (eventImagePreviewObjectUrl) {
            URL.revokeObjectURL(eventImagePreviewObjectUrl);
            eventImagePreviewObjectUrl = "";
        }

        if (eventImageUrl) eventImageUrl.value = url || "";

        if (eventImagePreview) {
            if (url) {
                eventImagePreview.src = url;
                eventImagePreview.hidden = false;
            }
            else {
                eventImagePreview.removeAttribute("src");
                eventImagePreview.hidden = true;
            }
        }

        if (removeEventImageButton) removeEventImageButton.hidden = !url;
        eventImageDropzone?.classList.toggle("has-file", Boolean(url));
    }


    function chooseEventImage(file) {
        try {
            validateImageFile(file);
            pendingEventImageFile = file;
            removeEventImageRequested = false;

            if (eventImagePreviewObjectUrl) URL.revokeObjectURL(eventImagePreviewObjectUrl);
            eventImagePreviewObjectUrl = URL.createObjectURL(file);
            if (eventImagePreview) {
                eventImagePreview.src = eventImagePreviewObjectUrl;
                eventImagePreview.hidden = false;
            }
            if (removeEventImageButton) removeEventImageButton.hidden = false;
            eventImageDropzone?.classList.add("has-file");
        }
        catch (error) {
            if (eventFormMessage) eventFormMessage.textContent = error.message;
        }
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

        if (eventAllDay) {
            eventAllDay.checked = false;
        }

        syncEventAllDayState();
        setEventImageState("");


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


        if (eventAllDay) {
            eventAllDay.checked = Number(selectedEvent.is_all_day) === 1;
        }

        eventTime.value =
            selectedEvent.event_time ||
            "";

        syncEventAllDayState();


        eventLocation.value =
            selectedEvent.location ||
            "";


        eventDescription.value =
            selectedEvent.description ||
            "";


        setEventImageState(
            selectedEvent.image_url ||
            ""
        );


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

        setEventImageState("");
        if (eventTime) eventTime.disabled = false;
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

            end_date:
                eventEndDate
                    ? eventEndDate.value || ""
                    : "",

            event_time:
                eventAllDay?.checked
                    ? ""
                    : eventTime.value || "",

            is_all_day:
                eventAllDay?.checked
                    ? 1
                    : 0,

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


            const savedEventId =
                data?.event?.id ||
                (existingId ? Number(existingId) : null);

            if (savedEventId && eventId) {
                eventId.value = String(savedEventId);
            }

            if (savedEventId && removeEventImageRequested) {
                await apiRequest(
                    `/api/events/${encodeURIComponent(savedEventId)}/image`,
                    { method: "DELETE" }
                );
            }

            if (savedEventId && pendingEventImageFile) {
                await apiBinaryRequest(
                    `/api/events/${encodeURIComponent(savedEventId)}/image`,
                    pendingEventImageFile
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

                    if (publishState) {
                        const eventsTop = document.querySelector(
                            "#panel-events .panel-heading"
                        );
                        eventsTop?.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });
                    }
                },
                350
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


    if (eventAllDay) {
        eventAllDay.addEventListener("change", syncEventAllDayState);
    }

    wireFileDropzone(
        eventImageDropzone,
        eventImageFile,
        chooseEventImage
    );

    removeEventImageButton?.addEventListener("click", event => {
        event.stopPropagation();
        pendingEventImageFile = null;
        removeEventImageRequested = true;
        if (eventImagePreviewObjectUrl) {
            URL.revokeObjectURL(eventImagePreviewObjectUrl);
            eventImagePreviewObjectUrl = "";
        }
        if (eventImageUrl) eventImageUrl.value = "";
        if (eventImagePreview) {
            eventImagePreview.removeAttribute("src");
            eventImagePreview.hidden = true;
        }
        removeEventImageButton.hidden = true;
        eventImageDropzone?.classList.remove("has-file");
    });


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

                        is_all_day:
                            Number(selectedEvent.is_all_day) || 0,

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
       MINISTRIES — PUBLISHER CRUD + OPTIONAL ICON UPLOAD
       ========================================================= */

    const ministryEditor = document.getElementById("ministry-editor");
    const ministryForm = document.getElementById("ministry-form");
    const ministriesLoading = document.getElementById("ministries-loading");
    const ministriesEmpty = document.getElementById("ministries-empty");
    const ministriesList = document.getElementById("ministries-list");
    const ministryIconUrl = document.getElementById("ministry-icon-url");
    const ministryIconDropzone = document.getElementById("ministry-icon-dropzone");
    const ministryIconFile = document.getElementById("ministry-icon-file");
    const ministryIconPreview = document.getElementById("ministry-icon-preview");
    const removeMinistryIconButton = document.getElementById("remove-ministry-icon-button");
    const ministryFormMessage = document.getElementById("ministry-form-message");
    const saveMinistryButton = document.getElementById("save-ministry-button");

    let ministriesCache = [];
    let pendingMinistryIconFile = null;
    let removeMinistryIconRequested = false;
    let ministryIconPreviewObjectUrl = "";

    function resolveMinistryIconUrl(url = "") {
        if (!url) return "";
        const value = String(url).trim();
        if (!value) return "";
        if (value.startsWith("images/")) {
            return new URL(`../${value}`, window.location.href).href;
        }
        return value;
    }

    function setMinistryIconState(url = "") {
        pendingMinistryIconFile = null;
        removeMinistryIconRequested = false;
        if (ministryIconPreviewObjectUrl) {
            URL.revokeObjectURL(ministryIconPreviewObjectUrl);
            ministryIconPreviewObjectUrl = "";
        }
        if (ministryIconUrl) ministryIconUrl.value = url || "";
        if (ministryIconPreview) {
            if (url) {
                ministryIconPreview.src = resolveMinistryIconUrl(url);
                ministryIconPreview.hidden = false;
            }
            else {
                ministryIconPreview.removeAttribute("src");
                ministryIconPreview.hidden = true;
            }
        }
        if (removeMinistryIconButton) removeMinistryIconButton.hidden = !url;
        ministryIconDropzone?.classList.toggle("has-file", Boolean(url));
    }

    function chooseMinistryIcon(file) {
        try {
            validateImageFile(file, 6);
            pendingMinistryIconFile = file;
            removeMinistryIconRequested = false;
            if (ministryIconPreviewObjectUrl) URL.revokeObjectURL(ministryIconPreviewObjectUrl);
            ministryIconPreviewObjectUrl = URL.createObjectURL(file);
            if (ministryIconPreview) {
                ministryIconPreview.src = ministryIconPreviewObjectUrl;
                ministryIconPreview.hidden = false;
            }
            if (removeMinistryIconButton) removeMinistryIconButton.hidden = false;
            ministryIconDropzone?.classList.add("has-file");
            if (ministryFormMessage) ministryFormMessage.textContent = "New icon ready to upload when the ministry is saved.";
        }
        catch (error) {
            if (ministryFormMessage) ministryFormMessage.textContent = error.message;
        }
    }

    wireFileDropzone(ministryIconDropzone, ministryIconFile, chooseMinistryIcon);

    removeMinistryIconButton?.addEventListener("click", event => {
        event.stopPropagation();
        pendingMinistryIconFile = null;
        removeMinistryIconRequested = true;
        if (ministryIconPreviewObjectUrl) {
            URL.revokeObjectURL(ministryIconPreviewObjectUrl);
            ministryIconPreviewObjectUrl = "";
        }
        if (ministryIconUrl) ministryIconUrl.value = "";
        if (ministryIconPreview) {
            ministryIconPreview.removeAttribute("src");
            ministryIconPreview.hidden = true;
        }
        removeMinistryIconButton.hidden = true;
        ministryIconDropzone?.classList.remove("has-file");
        if (ministryFormMessage) ministryFormMessage.textContent = "Icon will be removed when the ministry is saved.";
    });

    async function loadMinistries() {
        if (!ministriesList || !ministriesLoading || !ministriesEmpty) return;
        ministriesLoading.hidden = false;
        ministriesEmpty.hidden = true;
        ministriesList.hidden = true;

        try {
            const data = await apiRequest("/api/ministries");
            ministriesCache = Array.isArray(data.ministries) ? data.ministries : [];
            ministriesLoading.hidden = true;

            if (!ministriesCache.length) {
                ministriesEmpty.hidden = false;
                return;
            }

            ministriesList.innerHTML = ministriesCache.map(ministry => {
                const status = Number(ministry.is_visible) === 1 ? "Published" : "Hidden";
                const icon = ministry.icon_url
                    ? `<img class="ministry-publisher-thumb" src="${escapeHtml(resolveMinistryIconUrl(ministry.icon_url))}" alt="">`
                    : `<div class="ministry-publisher-thumb ministry-publisher-thumb-empty">✝</div>`;
                return `<article class="ministry-publisher-card" data-ministry-id="${ministry.id}">${icon}<div class="ministry-publisher-copy"><span class="event-status ${Number(ministry.is_visible) === 1 ? "published" : "draft"}">${status}</span><h3>${escapeHtml(ministry.name || "Ministry")}</h3><p>${escapeHtml(ministry.summary || "")}</p></div><div class="event-admin-actions"><button class="publisher-secondary-button" type="button" data-ministry-action="edit">EDIT</button><button class="publisher-danger-button" type="button" data-ministry-action="delete">DELETE</button></div></article>`;
            }).join("");
            ministriesList.hidden = false;
        }
        catch (error) {
            ministriesLoading.hidden = true;
            ministriesEmpty.hidden = false;
            ministriesEmpty.querySelector("h2").textContent = "Ministries Unavailable";
            ministriesEmpty.querySelector("p").textContent = error.message || "Unable to load ministries.";
        }
    }

    function openMinistryEditor(ministry = null) {
        if (!ministryForm || !ministryEditor) return;
        ministryForm.reset();
        document.getElementById("ministry-id").value = ministry?.id || "";
        document.getElementById("ministry-name-input").value = ministry?.name || "";
        document.getElementById("ministry-summary").value = ministry?.summary || "";
        document.getElementById("ministry-description-input").value = ministry?.description || "";
        document.getElementById("ministry-display-order").value = ministry?.display_order ?? 0;
        document.getElementById("ministry-visible").checked = ministry ? Number(ministry.is_visible) === 1 : true;
        document.getElementById("ministry-editor-title").textContent = ministry ? "Edit Ministry" : "Add Ministry";
        if (ministryFormMessage) ministryFormMessage.textContent = "";
        setMinistryIconState(ministry?.icon_url || "");
        ministryEditor.hidden = false;
        ministryEditor.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function getMinistryFormData() {
        return {
            name: document.getElementById("ministry-name-input").value.trim(),
            summary: document.getElementById("ministry-summary").value.trim(),
            description: document.getElementById("ministry-description-input").value.trim(),
            icon_url: ministryIconUrl?.value.trim() || "",
            display_order: Number(document.getElementById("ministry-display-order").value || 0),
            is_visible: document.getElementById("ministry-visible").checked
        };
    }

    document.getElementById("add-ministry-button")?.addEventListener("click", () => openMinistryEditor());
    document.getElementById("cancel-ministry-button")?.addEventListener("click", () => {
        if (ministryEditor) ministryEditor.hidden = true;
        setMinistryIconState("");
    });

    ministryForm?.addEventListener("submit", async event => {
        event.preventDefault();
        const existingId = document.getElementById("ministry-id").value;
        const payload = getMinistryFormData();

        if (!payload.name) {
            ministryFormMessage.textContent = "Ministry name is required.";
            return;
        }

        const originalText = saveMinistryButton?.textContent || "SAVE MINISTRY";
        if (saveMinistryButton) {
            saveMinistryButton.disabled = true;
            saveMinistryButton.textContent = "SAVING...";
        }
        ministryFormMessage.textContent = "Saving ministry...";

        try {
            const data = await apiRequest(
                existingId ? `/api/ministries/${existingId}` : "/api/ministries",
                { method: existingId ? "PUT" : "POST", body: JSON.stringify(payload) }
            );

            const savedId = data.id || Number(existingId);
            if (savedId) {
                document.getElementById("ministry-id").value = String(savedId);
                if (removeMinistryIconRequested) {
                    await apiRequest(`/api/ministries/${encodeURIComponent(savedId)}/icon`, { method: "DELETE" });
                }
                if (pendingMinistryIconFile) {
                    await apiBinaryRequest(`/api/ministries/${encodeURIComponent(savedId)}/icon`, pendingMinistryIconFile);
                }
            }

            if (ministryEditor) ministryEditor.hidden = true;
            setMinistryIconState("");
            await loadMinistries();
            document.querySelector("#panel-ministries .panel-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        catch (error) {
            ministryFormMessage.textContent = error.message || "Unable to save ministry.";
        }
        finally {
            if (saveMinistryButton) {
                saveMinistryButton.disabled = false;
                saveMinistryButton.textContent = originalText;
            }
        }
    });

    ministriesList?.addEventListener("click", async event => {
        const button = event.target.closest("[data-ministry-action]");
        if (!button) return;
        const card = button.closest("[data-ministry-id]");
        const id = card?.dataset.ministryId;
        const ministry = ministriesCache.find(item => String(item.id) === String(id));
        if (!ministry) return;

        if (button.dataset.ministryAction === "edit") {
            openMinistryEditor(ministry);
            return;
        }

        if (button.dataset.ministryAction === "delete") {
            if (!confirm(`Delete "${ministry.name}"? This removes it from the public Ministries page and cannot be undone.`)) return;
            try {
                await apiRequest(`/api/ministries/${encodeURIComponent(id)}`, { method: "DELETE" });
                await loadMinistries();
            }
            catch (error) {
                alert(error.message || "Unable to delete ministry.");
            }
        }
    });


    /* =========================================================
       LEADERSHIP — PUBLISHER CRUD + ONE-PHOTO UPLOAD
       ========================================================= */

    const leadershipEditor = document.getElementById("leadership-editor");
    const leadershipForm = document.getElementById("leader-form");
    const leadershipLoading = document.getElementById("leadership-loading");
    const leadershipEmpty = document.getElementById("leadership-empty");
    const leadershipList = document.getElementById("leadership-list");
    const leaderImageUrl = document.getElementById("leader-image-url");
    const leaderImageDropzone = document.getElementById("leader-image-dropzone");
    const leaderImageFile = document.getElementById("leader-image-file");
    const leaderImagePreview = document.getElementById("leader-image-preview");
    const removeLeaderImageButton = document.getElementById("remove-leader-image-button");
    const leaderFormMessage = document.getElementById("leader-form-message");
    const saveLeaderButton = document.getElementById("save-leader-button");

    let leadershipCache = [];
    let pendingLeaderImageFile = null;
    let removeLeaderImageRequested = false;
    let leaderImagePreviewObjectUrl = "";

    function setLeaderImageState(url = "") {
        pendingLeaderImageFile = null;
        removeLeaderImageRequested = false;
        if (leaderImagePreviewObjectUrl) {
            URL.revokeObjectURL(leaderImagePreviewObjectUrl);
            leaderImagePreviewObjectUrl = "";
        }
        if (leaderImageUrl) leaderImageUrl.value = url || "";
        if (leaderImagePreview) {
            if (url) {
                leaderImagePreview.src = url;
                leaderImagePreview.hidden = false;
            }
            else {
                leaderImagePreview.removeAttribute("src");
                leaderImagePreview.hidden = true;
            }
        }
        if (removeLeaderImageButton) removeLeaderImageButton.hidden = !url;
        leaderImageDropzone?.classList.toggle("has-file", Boolean(url));
    }

    function chooseLeaderImage(file) {
        try {
            validateImageFile(file);
            pendingLeaderImageFile = file;
            removeLeaderImageRequested = false;
            if (leaderImagePreviewObjectUrl) URL.revokeObjectURL(leaderImagePreviewObjectUrl);
            leaderImagePreviewObjectUrl = URL.createObjectURL(file);
            if (leaderImagePreview) {
                leaderImagePreview.src = leaderImagePreviewObjectUrl;
                leaderImagePreview.hidden = false;
            }
            if (removeLeaderImageButton) removeLeaderImageButton.hidden = false;
            leaderImageDropzone?.classList.add("has-file");
            if (leaderFormMessage) leaderFormMessage.textContent = "New photo ready to upload when the profile is saved.";
        }
        catch (error) {
            if (leaderFormMessage) leaderFormMessage.textContent = error.message;
        }
    }

    wireFileDropzone(leaderImageDropzone, leaderImageFile, chooseLeaderImage);

    removeLeaderImageButton?.addEventListener("click", event => {
        event.stopPropagation();
        pendingLeaderImageFile = null;
        removeLeaderImageRequested = true;
        if (leaderImagePreviewObjectUrl) {
            URL.revokeObjectURL(leaderImagePreviewObjectUrl);
            leaderImagePreviewObjectUrl = "";
        }
        if (leaderImageUrl) leaderImageUrl.value = "";
        if (leaderImagePreview) {
            leaderImagePreview.removeAttribute("src");
            leaderImagePreview.hidden = true;
        }
        removeLeaderImageButton.hidden = true;
        leaderImageDropzone?.classList.remove("has-file");
        if (leaderFormMessage) leaderFormMessage.textContent = "Photo will be removed when the profile is saved.";
    });

    async function loadLeadership() {
        if (!leadershipList || !leadershipLoading || !leadershipEmpty) return;
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
                const image = leader.image_url
                    ? `<img class="leadership-publisher-thumb" src="${escapeHtml(leader.image_url)}" alt="">`
                    : `<div class="leadership-publisher-thumb leadership-publisher-thumb-empty">✦</div>`;
                return `<article class="leadership-publisher-card" data-leader-id="${leader.id}">${image}<div class="leadership-publisher-copy"><span class="event-status ${Number(leader.is_visible) === 1 ? "published" : "draft"}">${status}</span><h3>${fullName}</h3><p>${escapeHtml(leader.title || "")}</p></div><div class="event-admin-actions"><button class="publisher-secondary-button" type="button" data-leader-action="edit">EDIT</button><button class="publisher-secondary-button" type="button" data-leader-action="preview">PREVIEW</button><button class="publisher-danger-button" type="button" data-leader-action="delete">DELETE</button></div></article>`;
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
        if (!leadershipForm || !leadershipEditor) return;
        leadershipForm.reset();
        document.getElementById("leader-id").value = leader?.id || "";
        document.getElementById("leader-first-name").value = leader?.first_name || "";
        document.getElementById("leader-last-name").value = leader?.last_name || "";
        document.getElementById("leader-title").value = leader?.title || "";
        document.getElementById("leader-biography").value = leader?.biography || "";
        document.getElementById("leader-display-order").value = leader?.display_order ?? 0;
        document.getElementById("leader-visible").checked = leader ? Number(leader.is_visible) === 1 : true;
        document.getElementById("leader-editor-title").textContent = leader ? "Edit Profile" : "Add Profile";
        if (leaderFormMessage) leaderFormMessage.textContent = "";
        setLeaderImageState(leader?.image_url || "");
        leadershipEditor.hidden = false;
        leadershipEditor.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function getLeaderFormData() {
        return {
            first_name: document.getElementById("leader-first-name").value.trim(),
            last_name: document.getElementById("leader-last-name").value.trim(),
            title: document.getElementById("leader-title").value.trim(),
            biography: document.getElementById("leader-biography").value.trim(),
            image_url: leaderImageUrl?.value.trim() || "",
            display_order: Number(document.getElementById("leader-display-order").value || 0),
            is_visible: document.getElementById("leader-visible").checked
        };
    }

    document.getElementById("add-leader-button")?.addEventListener("click", () => openLeaderEditor());
    document.getElementById("cancel-leader-button")?.addEventListener("click", () => {
        leadershipEditor.hidden = true;
        setLeaderImageState("");
    });

    leadershipForm?.addEventListener("submit", async event => {
        event.preventDefault();
        const existingId = document.getElementById("leader-id").value;
        const payload = getLeaderFormData();

        if (!payload.first_name || !payload.title) {
            leaderFormMessage.textContent = "First name and title are required.";
            return;
        }

        const originalText = saveLeaderButton?.textContent || "SAVE PROFILE";
        if (saveLeaderButton) {
            saveLeaderButton.disabled = true;
            saveLeaderButton.textContent = "SAVING...";
        }
        leaderFormMessage.textContent = "Saving profile...";

        try {
            const data = await apiRequest(
                existingId ? `/api/leadership/${existingId}` : "/api/leadership",
                { method: existingId ? "PUT" : "POST", body: JSON.stringify(payload) }
            );

            const savedId = data.id || Number(existingId);

            if (savedId) {
                document.getElementById("leader-id").value = String(savedId);
            }

            if (savedId && removeLeaderImageRequested) {
                await apiRequest(`/api/leadership/${encodeURIComponent(savedId)}/image`, { method: "DELETE" });
            }

            if (savedId && pendingLeaderImageFile) {
                await apiBinaryRequest(`/api/leadership/${encodeURIComponent(savedId)}/image`, pendingLeaderImageFile);
            }

            leadershipEditor.hidden = true;
            setLeaderImageState("");
            await loadLeadership();
            document.querySelector("#panel-leadership .panel-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        catch (error) {
            leaderFormMessage.textContent = error.message || "Unable to save leadership profile.";
        }
        finally {
            if (saveLeaderButton) {
                saveLeaderButton.disabled = false;
                saveLeaderButton.textContent = originalText;
            }
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
       WORSHIP MEDIA — UPLOAD + PUBLISHER LIST
       ========================================================= */

    const mediaEditor = document.getElementById("media-editor");
    const mediaForm = document.getElementById("media-form");
    const mediaDropzone = document.getElementById("media-dropzone");
    const mediaFileInput = document.getElementById("media-file");
    const mediaLoading = document.getElementById("media-loading");
    const mediaEmpty = document.getElementById("media-empty");
    const mediaList = document.getElementById("media-list");
    const mediaFormMessage = document.getElementById("media-form-message");
    const uploadMediaButton = document.getElementById("upload-media-button");
    let mediaCache = [];
    let pendingMediaFile = null;

    function validateGalleryFile(file) {
        const allowed = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]);
        if (!file || !allowed.has(file.type)) {
            throw new Error("Choose a JPG, PNG, WebP, MP4 or WebM file.");
        }
        const isVideo = file.type.startsWith("video/");
        const max = isVideo ? 75 : 15;
        if (file.size > max * 1024 * 1024) {
            throw new Error(`${isVideo ? "Video" : "Image"} must be ${max} MB or smaller.`);
        }
    }

    function chooseGalleryFile(file) {
        try {
            validateGalleryFile(file);
            pendingMediaFile = file;
            mediaDropzone?.classList.add("has-file");
            if (mediaFormMessage) mediaFormMessage.textContent = `${file.name} ready to upload.`;
        }
        catch (error) {
            pendingMediaFile = null;
            if (mediaFormMessage) mediaFormMessage.textContent = error.message;
        }
    }

    wireFileDropzone(mediaDropzone, mediaFileInput, chooseGalleryFile);

    async function loadGallery() {
        if (!mediaLoading || !mediaEmpty || !mediaList) return;
        mediaLoading.hidden = false;
        mediaEmpty.hidden = true;
        mediaList.hidden = true;
        try {
            const data = await apiRequest("/api/gallery");
            mediaCache = Array.isArray(data.items) ? data.items : [];
            mediaLoading.hidden = true;
            if (!mediaCache.length) {
                mediaEmpty.hidden = false;
                return;
            }
            mediaList.innerHTML = mediaCache.map(item => {
                const isVideo = item.media_type === "video";
                const visual = isVideo
                    ? `<video src="${escapeHtml(item.media_url)}" muted preload="metadata"></video>`
                    : `<img src="${escapeHtml(item.media_url)}" alt="">`;
                return `<article class="media-publisher-card" data-media-id="${item.id}">${visual}<div class="media-publisher-copy"><span class="event-status ${Number(item.is_published) === 1 ? "published" : "draft"}">${Number(item.is_published) === 1 ? "Published" : "Draft"}</span><h3>${escapeHtml(item.title || (isVideo ? "Video" : "Photo"))}</h3><p>${escapeHtml(item.caption || "")}</p><div class="event-admin-actions"><button class="publisher-secondary-button" type="button" data-media-action="toggle">${Number(item.is_published) === 1 ? "UNPUBLISH" : "PUBLISH"}</button><button class="publisher-danger-button" type="button" data-media-action="delete">DELETE</button></div></div></article>`;
            }).join("");
            mediaList.hidden = false;
        }
        catch (error) {
            mediaLoading.hidden = true;
            mediaEmpty.hidden = false;
            mediaEmpty.querySelector("h2").textContent = "Media Unavailable";
            mediaEmpty.querySelector("p").textContent = error.message || "Unable to load media.";
        }
    }

    document.getElementById("add-media-button")?.addEventListener("click", () => {
        mediaForm?.reset();
        pendingMediaFile = null;
        mediaDropzone?.classList.remove("has-file");
        if (mediaFormMessage) mediaFormMessage.textContent = "";
        if (mediaEditor) mediaEditor.hidden = false;
        mediaEditor?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    document.getElementById("cancel-media-button")?.addEventListener("click", () => {
        if (mediaEditor) mediaEditor.hidden = true;
        pendingMediaFile = null;
        mediaDropzone?.classList.remove("has-file");
    });

    mediaForm?.addEventListener("submit", async event => {
        event.preventDefault();
        if (!pendingMediaFile) {
            mediaFormMessage.textContent = "Choose a photo or video first.";
            return;
        }

        const originalText = uploadMediaButton?.textContent || "UPLOAD MEDIA";
        if (uploadMediaButton) {
            uploadMediaButton.disabled = true;
            uploadMediaButton.textContent = "UPLOADING...";
        }
        mediaFormMessage.textContent = "Uploading media...";

        try {
            const formData = new FormData();
            formData.append("file", pendingMediaFile);
            formData.append("title", document.getElementById("media-title").value.trim());
            formData.append("caption", document.getElementById("media-caption").value.trim());
            formData.append("display_order", document.getElementById("media-display-order").value || "0");
            formData.append("is_published", document.getElementById("media-published").checked ? "1" : "0");
            await apiFormRequest("/api/gallery", formData);
            mediaEditor.hidden = true;
            pendingMediaFile = null;
            mediaDropzone?.classList.remove("has-file");
            await loadGallery();
            document.querySelector("#panel-gallery .panel-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        catch (error) {
            mediaFormMessage.textContent = error.message || "Unable to upload media.";
        }
        finally {
            if (uploadMediaButton) {
                uploadMediaButton.disabled = false;
                uploadMediaButton.textContent = originalText;
            }
        }
    });

    mediaList?.addEventListener("click", async event => {
        const button = event.target.closest("[data-media-action]");
        if (!button) return;
        const card = button.closest("[data-media-id]");
        const id = card?.dataset.mediaId;
        const item = mediaCache.find(entry => String(entry.id) === String(id));
        if (!item) return;

        try {
            if (button.dataset.mediaAction === "toggle") {
                await apiRequest(`/api/gallery/${encodeURIComponent(id)}`, {
                    method: "PUT",
                    body: JSON.stringify({ is_published: Number(item.is_published) === 1 ? 0 : 1 })
                });
                await loadGallery();
            }
            if (button.dataset.mediaAction === "delete") {
                if (!confirm("Delete this media item? This cannot be undone.")) return;
                await apiRequest(`/api/gallery/${encodeURIComponent(id)}`, { method: "DELETE" });
                await loadGallery();
            }
        }
        catch (error) {
            alert(error.message || "Unable to update media.");
        }
    });


    /* =========================================================
       SITE BRANDING — FIXED-SLOT UPLOADS
       ========================================================= */

    const brandingMessage = document.getElementById("branding-message");
    const brandingLogoPreview = document.getElementById("branding-logo-preview");
    const brandingHeroPreview = document.getElementById("branding-hero-preview");
    const brandingLogoDropzone = document.getElementById("branding-logo-dropzone");
    const brandingHeroDropzone = document.getElementById("branding-hero-dropzone");
    const brandingLogoFile = document.getElementById("branding-logo-file");
    const brandingHeroFile = document.getElementById("branding-hero-file");

    async function loadBranding() {
        try {
            const data = await apiRequest("/api/site-settings");
            if (data.settings?.church_logo && brandingLogoPreview) brandingLogoPreview.src = data.settings.church_logo;
            if (data.settings?.hero_image && brandingHeroPreview) brandingHeroPreview.src = data.settings.hero_image;
        }
        catch (error) {
            if (brandingMessage) brandingMessage.textContent = error.message || "Unable to load branding settings.";
        }
    }

    async function uploadBrandingAsset(kind, file) {
        try {
            validateImageFile(file, kind === "hero" ? 20 : 8);
            if (brandingMessage) brandingMessage.textContent = `Uploading ${kind === "hero" ? "hero image" : "logo"}...`;
            const data = await apiBinaryRequest(`/api/branding/${kind}`, file);
            if (kind === "logo" && brandingLogoPreview) brandingLogoPreview.src = data.url;
            if (kind === "hero" && brandingHeroPreview) brandingHeroPreview.src = data.url;
            if (brandingMessage) brandingMessage.textContent = `${kind === "hero" ? "Homepage hero" : "Church logo"} updated.`;
        }
        catch (error) {
            if (brandingMessage) brandingMessage.textContent = error.message || "Unable to update branding.";
        }
    }

    wireFileDropzone(brandingLogoDropzone, brandingLogoFile, file => uploadBrandingAsset("logo", file));
    wireFileDropzone(brandingHeroDropzone, brandingHeroFile, file => uploadBrandingAsset("hero", file));


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