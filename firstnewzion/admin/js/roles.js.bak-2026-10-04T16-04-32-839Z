"use strict";

/* FNZ_ROLE_SYSTEM_V1
 * Website Publisher role/scoping UI.
 * Security is enforced by the Worker. This file only mirrors permissions in the UI.
 */

(() => {
    const RBAC_API_URL = "https://fnz-website-api.904degreeslabs.workers.dev";
    const TOKEN_KEY = "fnzPublisherToken";
    const USER_KEY = "fnzPublisherUser";

    let currentUser = null;
    let pendingRequests = [];
    let eventWorkflow = new Map();

    document.addEventListener("DOMContentLoaded", initializeRoleSystem);

    async function initializeRoleSystem() {
        const token = sessionStorage.getItem(TOKEN_KEY);
        if (!token) return;

        injectRoleStyles();

        try {
            const data = await api("/api/auth/me");
            currentUser = data.user;
            sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));

            applyRoleVisibility();
            decorateUserIdentity();

            // Owner controls are critical. Build Team & Roles first so a
            // failure in an unrelated content module can never leave the
            // Add Team Member button as the old inert dashboard stub.
            if (hasPermission("team.manage")) {
                await buildTeamAndRolesPanel();
            }

            // installTeamButtonFallback(); // disabled: real Owner panel is active
            configureEventPublisherControls();
            enforceMinistryScopes();
            ensureMinistryEventSelector();
            installEventScopeFetchBridge();
            await loadEventWorkflowStates();

            if (hasPermission("publication.review")) {
                await loadPublicationQueue();
            }

            if (currentUser.mustChangePassword) {
                showRequiredPasswordChange();
            }

            // observeDynamicPublisherUi(); // disabled: Firefox freeze
        }
        catch (error) {
            console.warn("FNZ access controls could not initialize:", error.message);
        }
    }

    function hasPermission(permission) {
        return Boolean(currentUser?.permissions?.includes(permission));
    }

    async function api(path, options = {}) {
        const token = sessionStorage.getItem(TOKEN_KEY);
        const headers = {
            ...(options.headers || {}),
            "Authorization": `Bearer ${token}`
        };

        if (options.body && !(options.body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
        }

        const response = await fetch(`${RBAC_API_URL}${path}`, { ...options, headers });
        let data = {};
        try { data = await response.json(); } catch (_) { data = {}; }

        if (response.status === 401) {
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(USER_KEY);
            window.location.href = "index.html";
            throw new Error("Your Publisher session has expired.");
        }
        if (!response.ok) throw new Error(data.error || "Publisher request failed.");
        return data;
    }

    function decorateUserIdentity() {
        const display = document.getElementById("user-display-name");
        if (display && currentUser) {
            display.textContent = `${currentUser.firstName} Â· ${currentUser.roleLabel || roleLabel(currentUser.role)}`;
        }

        const headerActions = document.querySelector(".publisher-header-actions");
        if (headerActions && !document.getElementById("rbac-role-pill")) {
            const pill = document.createElement("span");
            pill.id = "rbac-role-pill";
            pill.className = "rbac-role-pill";
            pill.textContent = currentUser.roleLabel || roleLabel(currentUser.role);
            headerActions.insertBefore(pill, headerActions.firstChild);
        }
    }

    function roleLabel(role) {
        return ({
            owner: "Owner",
            administrator: "Administrator",
            media_team: "Media Team",
            ministry_leader: "Ministry Leader",
            viewer: "Viewer"
        })[role] || "Viewer";
    }

    function allowedPanelsForRole(role) {
        if (role === "owner") return null; // null = all panels
        if (role === "administrator") return new Set([
            "overview", "events", "gallery", "media", "worship-media",
            "ministries", "ministry", "leadership", "branding"
        ]);
        if (role === "media_team") return new Set([
            "overview", "events", "gallery", "media", "worship-media"
        ]);
        if (role === "ministry_leader") return new Set([
            "overview", "events", "ministries", "ministry"
        ]);
        return new Set(["overview"]);
    }

    function applyRoleVisibility() {
        if (!currentUser) return;
        const allowed = allowedPanelsForRole(currentUser.role);

        document.querySelectorAll("[data-panel]").forEach(element => {
            const panel = String(element.dataset.panel || "").toLowerCase();
            const canSee = allowed === null || allowed.has(panel);
            element.hidden = !canSee;
        });

        document.querySelectorAll(".publisher-panel[id^='panel-']").forEach(panel => {
            const name = panel.id.replace(/^panel-/, "").toLowerCase();
            const canSee = allowed === null || allowed.has(name);
            panel.hidden = !canSee;
            if (!canSee) panel.classList.remove("active");
        });

        // Team & Roles is intentionally Owner-only.
        if (!hasPermission("team.manage")) {
            hidePanelByName("team");
        }

        // Administrators may edit through branding, but cannot alter roles/ownership.
        if (currentUser.role === "administrator") {
            document.querySelectorAll("[data-open-panel='team'], [data-panel='team'], #panel-team").forEach(el => el.hidden = true);
        }

        const activeVisible = document.querySelector(".publisher-panel.active:not([hidden])");
        if (!activeVisible) {
            const overviewButton = document.querySelector(".publisher-nav-button[data-panel='overview']");
            overviewButton?.click();
        }
    }

    function hidePanelByName(name) {
        document.querySelectorAll(`[data-panel='${name}'], [data-open-panel='${name}'], #panel-${name}`).forEach(el => {
            el.hidden = true;
            el.classList.remove("active");
        });
    }

    function enforceMinistryScopes() {
        if (currentUser?.role !== "ministry_leader") return;
        const allowedKeys = new Set(
            (currentUser.scopes || [])
                .filter(scope => scope.type === "ministry")
                .map(scope => normalizeKey(scope.key))
        );

        const selectors = ["[data-ministry-key]", "[data-ministry]", "[data-scope-key]"];
        document.querySelectorAll(selectors.join(",")).forEach(element => {
            const raw = element.dataset.ministryKey || element.dataset.ministry || element.dataset.scopeKey || "";
            if (raw && !allowedKeys.has(normalizeKey(raw))) element.hidden = true;
        });
    }

    function normalizeKey(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    function ensureMinistryEventSelector() {
        if (currentUser?.role !== "ministry_leader") return;
        if (document.getElementById("rbac-event-ministry")) return;

        const scopes = (currentUser.scopes || []).filter(scope => scope.type === "ministry");
        if (!scopes.length) return;

        const grid = document.querySelector("#event-form .event-form-grid");
        if (!grid) return;

        const label = document.createElement("label");
        label.className = "event-field event-field-wide";
        label.id = "rbac-event-ministry-field";
        label.innerHTML = `
            <span>MINISTRY *</span>
            <select id="rbac-event-ministry" required>
                ${scopes.map(scope => `<option value="${escapeAttribute(scope.key)}">${escapeHtml(prettyKey(scope.key))}</option>`).join("")}
            </select>
            <small>This event will be submitted under the selected assigned ministry.</small>
        `;
        grid.prepend(label);
    }

    function prettyKey(value) {
        return String(value || "").split("-").filter(Boolean)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    function installEventScopeFetchBridge() {
        if (window.__fnzRoleFetchBridgeInstalled) return;
        if (currentUser?.role !== "ministry_leader") return;

        const originalFetch = window.fetch.bind(window);
        window.__fnzRoleFetchBridgeInstalled = true;

        window.fetch = function(input, init = {}) {
            try {
                const url = typeof input === "string" ? input : input?.url || "";
                const method = String(init.method || "GET").toUpperCase();
                const isEventWrite = /\/api\/events(?:\/\d+)?(?:\?|$)/.test(url)
                    && ["POST", "PUT", "PATCH"].includes(method);

                if (isEventWrite && typeof init.body === "string") {
                    const data = JSON.parse(init.body);
                    const selector = document.getElementById("rbac-event-ministry");
                    if (selector?.value) data.ministry_key = selector.value;
                    init = { ...init, body: JSON.stringify(data) };
                }
            }
            catch (_) {
                // Preserve the original request if the body is not JSON.
            }
            return originalFetch(input, init);
        };
    }

    async function loadEventWorkflowStates() {
        try {
            const data = await api("/api/events");
            eventWorkflow = new Map((data.events || []).map(item => [String(item.id), item]));
            markPendingEventCards();
        }
        catch (error) {
            console.warn("Unable to load event workflow status:", error.message);
        }
    }

    function configureEventPublisherControls() {
        const publishButton = document.getElementById("publish-event-button");
        const unpublishButton = document.getElementById("unpublish-event-button");

        if (!publishButton) return;

        if (hasPermission("events.publish")) {
            publishButton.dataset.rbacMode = "publish";
            return;
        }

        if (hasPermission("events.submit")) {
            publishButton.dataset.rbacMode = "submit";
            publishButton.textContent = "SUBMIT FOR PUBLISHING";
            publishButton.title = "Send this item to the Owner and Administrators for review.";
            if (!publishButton.dataset.rbacRefreshBound) {
                publishButton.dataset.rbacRefreshBound = "1";
                publishButton.addEventListener("click", () => {
                    window.setTimeout(loadEventWorkflowStates, 900);
                });
            }
            if (unpublishButton) unpublishButton.hidden = true;
        }
        else {
            publishButton.hidden = true;
            const saveDraft = document.getElementById("save-draft-button");
            if (saveDraft) saveDraft.hidden = true;
            const addEvent = document.getElementById("add-event-button");
            if (addEvent) addEvent.hidden = true;
        }
    }

    function observeDynamicPublisherUi() {
        const observerOptions = {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["hidden"]
        };

        let refreshQueued = false;

        const observer = new MutationObserver(() => {
            if (refreshQueued) return;
            refreshQueued = true;

            window.requestAnimationFrame(() => {
                /*
                 * Disconnect while we mirror permissions into the DOM.
                 * Those updates intentionally change `hidden` attributes and
                 * status text. Observing our own changes caused an infinite
                 * MutationObserver loop when Add Team Member opened.
                 */
                observer.disconnect();

                try {
                    applyRoleVisibility();
                    configureEventPublisherControls();
                    enforceMinistryScopes();
                    markPendingEventCards();
                }
                finally {
                    observer.observe(document.body, observerOptions);
                    refreshQueued = false;
                }
            });
        });

        observer.observe(document.body, observerOptions);
    }

    async function loadPublicationQueue() {
        try {
            const data = await api("/api/publication-requests");
            pendingRequests = data.requests || [];
            renderPendingBadge(data.count || 0);
            renderPublicationQueue();
            markPendingEventCards();
        }
        catch (error) {
            console.warn("Unable to load publication queue:", error.message);
        }
    }

    function renderPendingBadge(count) {
        let badge = document.getElementById("rbac-pending-badge");
        const header = document.querySelector(".publisher-header-actions");
        if (!header) return;

        if (!badge) {
            badge = document.createElement("button");
            badge.id = "rbac-pending-badge";
            badge.className = "rbac-pending-badge";
            badge.type = "button";
            badge.addEventListener("click", () => {
                document.getElementById("rbac-publication-queue")?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
            header.insertBefore(badge, document.getElementById("logout-button") || null);
        }

        badge.textContent = count === 1 ? "1 AWAITING REVIEW" : `${count} AWAITING REVIEW`;
        badge.hidden = count === 0;
    }

    function renderPublicationQueue() {
        const overview = document.getElementById("panel-overview");
        if (!overview) return;

        let queue = document.getElementById("rbac-publication-queue");
        if (!queue) {
            queue = document.createElement("section");
            queue.id = "rbac-publication-queue";
            queue.className = "rbac-review-panel";
            const grid = overview.querySelector(".dashboard-grid");
            overview.insertBefore(queue, grid || null);
        }

        if (!pendingRequests.length) {
            queue.innerHTML = `
                <div class="rbac-review-heading">
                    <div><span class="rbac-kicker">APPROVAL QUEUE</span><h2>Nothing waiting</h2></div>
                    <span class="rbac-zero">0 PENDING</span>
                </div>
                <p class="rbac-muted">New submissions from Media Team and Ministry Leaders will appear here.</p>
            `;
            return;
        }

        queue.innerHTML = `
            <div class="rbac-review-heading">
                <div><span class="rbac-kicker">APPROVAL QUEUE</span><h2>Awaiting Publication</h2></div>
                <span class="rbac-count">${pendingRequests.length} PENDING</span>
            </div>
            <div class="rbac-request-list">
                ${pendingRequests.map(item => `
                    <article class="rbac-request" data-request-id="${item.id}">
                        <div class="rbac-request-copy">
                            <div class="rbac-request-meta">${escapeHtml(item.entityType.toUpperCase())} Â· submitted by ${escapeHtml(item.submittedBy)}</div>
                            <h3>${escapeHtml(item.title)}</h3>
                            <p>${formatRequestDate(item)}</p>
                            ${item.scopeKey ? `<span class="rbac-scope">${escapeHtml(item.scopeKey)}</span>` : ""}
                        </div>
                        <div class="rbac-request-actions">
                            ${item.entityType === "event" ? `<button type="button" data-rbac-action="edit" data-event-id="${item.entityId}">EDIT</button>` : ""}
                            <button type="button" class="rbac-primary" data-rbac-action="publish" data-request-id="${item.id}">PUBLISH</button>
                            <button type="button" data-rbac-action="changes" data-request-id="${item.id}">REQUEST CHANGES</button>
                            <button type="button" class="rbac-danger" data-rbac-action="reject" data-request-id="${item.id}">REJECT</button>
                        </div>
                    </article>
                `).join("")}
            </div>
        `;

        queue.querySelectorAll("[data-rbac-action]").forEach(button => {
            button.addEventListener("click", handleQueueAction);
        });
    }

    function formatRequestDate(item) {
        const date = item.eventDate ? new Date(`${item.eventDate}T12:00:00`) : null;
        const parts = [];
        if (date && !Number.isNaN(date.getTime())) parts.push(date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }));
        if (item.eventTime) parts.push(item.eventTime);
        if (item.location) parts.push(item.location);
        return escapeHtml(parts.join(" Â· ") || "Ready for review");
    }

    async function handleQueueAction(event) {
        const button = event.currentTarget;
        const action = button.dataset.rbacAction;
        button.disabled = true;

        try {
            if (action === "edit") {
                await openEventForReview(button.dataset.eventId);
                return;
            }

            const requestId = button.dataset.requestId;
            if (action === "publish") {
                await api(`/api/publication-requests/${requestId}/publish`, { method: "POST", body: "{}" });
            }
            else if (action === "changes") {
                const note = window.prompt("What needs to be changed? (optional)", "") ?? null;
                if (note === null) return;
                await api(`/api/publication-requests/${requestId}/changes`, { method: "POST", body: JSON.stringify({ note }) });
            }
            else if (action === "reject") {
                const note = window.prompt("Reason for rejecting this submission? (optional)", "") ?? null;
                if (note === null) return;
                if (!window.confirm("Reject this publication request?")) return;
                await api(`/api/publication-requests/${requestId}/reject`, { method: "POST", body: JSON.stringify({ note }) });
            }

            await loadPublicationQueue();
            await loadEventWorkflowStates();
            document.querySelector(".publisher-nav-button[data-panel='events']")?.click();
        }
        catch (error) {
            window.alert(error.message);
        }
        finally {
            button.disabled = false;
        }
    }

    async function openEventForReview(eventId) {
        const data = await api(`/api/events/${eventId}`);
        const item = data.event;

        document.querySelector(".publisher-nav-button[data-panel='events']")?.click();

        // Use the existing Publisher editor handler when the card is already rendered.
        const existingEditButton = document.querySelector(
            `[data-event-action="edit"][data-event-id="${CSS.escape(String(eventId))}"]`
        );
        if (existingEditButton) {
            existingEditButton.click();
            const statusText = document.getElementById("event-editor-status-text");
            if (statusText) statusText.textContent = "AWAITING REVIEW";
            document.getElementById("event-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }

        setValue("event-id", item.id);
        setValue("event-title", item.title);
        setValue("event-date", item.event_date);
        setValue("event-end-date", item.end_date || "");
        setValue("event-time", item.event_time || "");
        setValue("event-location", item.location || "");
        setValue("event-description", item.description || "");
        setValue("event-image-url", item.image_url || "");

        const editor = document.getElementById("event-editor");
        const editorTitle = document.getElementById("event-editor-title");
        const status = document.getElementById("event-editor-status");
        const statusText = document.getElementById("event-editor-status-text");
        const publish = document.getElementById("publish-event-button");

        if (editor) editor.hidden = false;
        if (editorTitle) editorTitle.textContent = "Review Submitted Event";
        if (status) status.hidden = false;
        if (statusText) statusText.textContent = "AWAITING REVIEW";
        if (publish && hasPermission("events.publish")) publish.textContent = "PUBLISH EVENT";

        editor?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function setValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value ?? "";
    }

    function markPendingEventCards() {
        const queueIds = new Set(
            pendingRequests
                .filter(item => item.entityType === "event")
                .map(item => String(item.entityId))
        );

        document.querySelectorAll("[data-event-id]").forEach(control => {
            const id = String(control.dataset.eventId || "");
            const card = control.closest(".event-admin-card") || control;
            const event = eventWorkflow.get(id);
            const status = event?.workflow_status || (queueIds.has(id) ? "pending" : "");

            card.classList.toggle("rbac-awaiting-review", status === "pending");

            const statusElement = card.querySelector?.(".event-status");
            if (statusElement && status) {
                const labels = {
                    pending: "Awaiting Review",
                    changes_requested: "Changes Requested",
                    rejected: "Rejected",
                    draft: "Draft",
                    published: "Published"
                };
                statusElement.textContent = labels[status] || status;
            }

            if (event && !event.can_edit && !hasPermission("events.edit_all")) {
                card.querySelectorAll?.("[data-event-action='edit'], [data-event-action='delete']")
                    .forEach(button => button.hidden = true);
            }
        });
    }


    function installTeamButtonFallback() {
        if (window.__fnzTeamButtonFallbackInstalled) return;
        window.__fnzTeamButtonFallbackInstalled = true;

        document.addEventListener("click", async event => {
            const button = event.target.closest("button");
            if (!button) return;

            const text = String(button.textContent || "")
                .replace(/\s+/g, " ")
                .trim()
                .toUpperCase();

            const isAddTeamButton =
                button.id === "rbac-add-member" ||
                text === "+ ADD TEAM MEMBER" ||
                text === "ADD TEAM MEMBER";

            if (!isAddTeamButton || !hasPermission("team.manage")) return;

            event.preventDefault();
            event.stopPropagation();

            let form = document.getElementById("rbac-add-member-form");
            if (!form) {
                await buildTeamAndRolesPanel();
                form = document.getElementById("rbac-add-member-form");
            }

            if (form) {
                form.hidden = false;
                // Firefox-safe: no automatic scrolling
                // Firefox-safe: no automatic focus
            }
        }, true);
    }

    async function buildTeamAndRolesPanel() {
        const panel = document.getElementById("panel-team");
        if (!panel) return;

        panel.hidden = false;
        panel.innerHTML = `
            <div class="panel-heading rbac-team-heading">
                <div>
                    <p class="dashboard-eyebrow">OWNER</p>
                    <h1>Team &amp; Roles</h1>
                    <p>Only the Owner can promote, demote or deactivate accounts. The Owner does not count toward the Administrator limit.</p>
                </div>
                <button id="rbac-add-member" class="publisher-button" type="button">+ ADD TEAM MEMBER</button>
            </div>

            <div class="rbac-access-summary">
                <div>
                    <span class="rbac-kicker">ADMINISTRATOR LIMIT</span>
                    <strong id="rbac-admin-count">â€”</strong>
                </div>
                <label>
                    <span>Maximum Administrators</span>
                    <select id="rbac-admin-limit"><option value="3">3</option><option value="4">4</option></select>
                </label>
            </div>

            <form id="rbac-add-member-form" class="rbac-form" hidden>
                <div class="rbac-form-heading"><h2>Add Team Member</h2><button id="rbac-close-member" type="button">CANCEL</button></div>
                <div class="rbac-form-grid">
                    <label><span>FIRST NAME *</span><input id="rbac-first-name" required maxlength="80"></label>
                    <label><span>LAST NAME *</span><input id="rbac-last-name" required maxlength="80"></label>
                    <label class="rbac-wide"><span>PERSONAL EMAIL *</span><input id="rbac-email" type="email" required maxlength="200"></label>
                    <label><span>ROLE *</span><select id="rbac-role"><option value="viewer">Viewer</option><option value="ministry_leader">Ministry Leader</option><option value="media_team">Media Team</option><option value="administrator">Administrator</option></select></label>
                    <label><span>TEMPORARY PASSWORD *</span><input id="rbac-temp-password" type="password" minlength="12" required autocomplete="new-password"></label>
                    <label id="rbac-ministry-scope-row" class="rbac-wide" hidden><span>ASSIGNED MINISTRIES</span><input id="rbac-ministry-scopes" placeholder="Youth Ministry, Ushers, Music Ministry"><small>Separate multiple ministries with commas. Names are converted to stable ministry keys.</small></label>
                </div>
                <div id="rbac-team-message" class="rbac-message"></div>
                <button class="publisher-button" type="submit">CREATE ACCOUNT</button>
            </form>

            <div id="rbac-team-list" class="rbac-team-list"><p class="rbac-muted">Loading teamâ€¦</p></div>

            <section class="rbac-transfer-box">
                <div><span class="rbac-kicker">OWNERSHIP</span><h2>Transfer Ownership</h2><p>The new person becomes Owner. Your account automatically becomes an Administrator.</p></div>
                <div class="rbac-transfer-controls"><select id="rbac-new-owner"></select><button id="rbac-transfer-owner" type="button" class="publisher-secondary-button">TRANSFER OWNERSHIP</button></div>
            </section>
        `;

        document.getElementById("rbac-add-member")?.addEventListener("click", () => {
            setHidden("rbac-add-member-form", false);
            // Firefox-safe: no automatic scrolling
            // Firefox-safe: no automatic focus
        });
        document.getElementById("rbac-close-member")?.addEventListener("click", () => setHidden("rbac-add-member-form", true));
        document.getElementById("rbac-role")?.addEventListener("change", updateMinistryScopeVisibility);
        document.getElementById("rbac-add-member-form")?.addEventListener("submit", createTeamMember);
        document.getElementById("rbac-admin-limit")?.addEventListener("change", updateAdminLimit);
        document.getElementById("rbac-transfer-owner")?.addEventListener("click", transferOwnership);

        await refreshTeamPanel();
    }

    function updateMinistryScopeVisibility() {
        const role = document.getElementById("rbac-role")?.value;
        setHidden("rbac-ministry-scope-row", role !== "ministry_leader");
    }

    function setHidden(id, hidden) {
        const element = document.getElementById(id);
        if (element) element.hidden = hidden;
    }

    function scopesFromText(text) {
        return String(text || "").split(",")
            .map(value => normalizeKey(value))
            .filter(Boolean)
            .filter((value, index, array) => array.indexOf(value) === index)
            .map(key => ({ type: "ministry", key }));
    }

    async function createTeamMember(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const message = document.getElementById("rbac-team-message");
        const role = document.getElementById("rbac-role").value;
        const body = {
            firstName: document.getElementById("rbac-first-name").value.trim(),
            lastName: document.getElementById("rbac-last-name").value.trim(),
            email: document.getElementById("rbac-email").value.trim(),
            temporaryPassword: document.getElementById("rbac-temp-password").value,
            role,
            scopes: role === "ministry_leader" ? scopesFromText(document.getElementById("rbac-ministry-scopes").value) : []
        };

        message.textContent = "Creating accountâ€¦";
        try {
            const data = await api("/api/team", { method: "POST", body: JSON.stringify(body) });
            message.textContent = data.message;
            form.reset();
            updateMinistryScopeVisibility();
            await refreshTeamPanel();
        }
        catch (error) {
            message.textContent = error.message;
        }
    }

    async function refreshTeamPanel() {
        const [teamData, settingsData] = await Promise.all([
            api("/api/team"),
            api("/api/access/settings")
        ]);

        const team = teamData.team || [];
        const settings = settingsData.settings;
        const count = document.getElementById("rbac-admin-count");
        const limit = document.getElementById("rbac-admin-limit");
        if (count) count.textContent = `${settings.administratorCount} OF ${settings.maxAdministrators} USED`;
        if (limit) limit.value = String(settings.maxAdministrators);

        renderTeamList(team);
        renderOwnershipCandidates(team);
    }

    function renderTeamList(team) {
        const list = document.getElementById("rbac-team-list");
        if (!list) return;

        list.innerHTML = team.map(member => {
            const isOwner = member.role === "owner";
            const scopes = (member.scopes || []).filter(x => x.type === "ministry").map(x => x.key).join(", ");
            return `
                <article class="rbac-member" data-user-id="${member.id}">
                    <div class="rbac-member-identity">
                        <div class="rbac-avatar">${escapeHtml((member.firstName?.[0] || "?") + (member.lastName?.[0] || ""))}</div>
                        <div><h3>${escapeHtml(member.firstName)} ${escapeHtml(member.lastName)}</h3><p>${escapeHtml(member.email)}</p></div>
                    </div>
                    <div class="rbac-member-controls">
                        <label><span>ROLE</span>
                            ${isOwner
                                ? `<strong class="rbac-owner-label">OWNER</strong>`
                                : `<select data-member-role>
                                    ${roleOption("administrator", member.role)}
                                    ${roleOption("media_team", member.role)}
                                    ${roleOption("ministry_leader", member.role)}
                                    ${roleOption("viewer", member.role)}
                                  </select>`}
                        </label>
                        ${!isOwner ? `<label data-member-scope-wrap ${member.role === "ministry_leader" ? "" : "hidden"}><span>MINISTRIES</span><input data-member-scopes value="${escapeAttribute(scopes)}" placeholder="youth-ministry, ushers"></label>` : ""}
                        <label class="rbac-active-toggle"><span>ACTIVE</span><input type="checkbox" data-member-active ${member.isActive ? "checked" : ""} ${isOwner ? "disabled" : ""}></label>
                        ${member.mustChangePassword ? `<span class="rbac-temp-pill">TEMP PASSWORD</span>` : ""}
                        ${!isOwner ? `<button type="button" data-save-member class="publisher-secondary-button">SAVE</button>` : ""}
                    </div>
                </article>
            `;
        }).join("");

        list.querySelectorAll("[data-member-role]").forEach(select => {
            select.addEventListener("change", event => {
                const member = event.currentTarget.closest(".rbac-member");
                const wrap = member?.querySelector("[data-member-scope-wrap]");
                if (wrap) wrap.hidden = event.currentTarget.value !== "ministry_leader";
            });
        });

        list.querySelectorAll("[data-save-member]").forEach(button => button.addEventListener("click", saveTeamMember));
    }

    function roleOption(value, current) {
        return `<option value="${value}" ${value === current ? "selected" : ""}>${roleLabel(value)}</option>`;
    }

    async function saveTeamMember(event) {
        const button = event.currentTarget;
        const member = button.closest(".rbac-member");
        const userId = member.dataset.userId;
        const role = member.querySelector("[data-member-role]").value;
        const active = member.querySelector("[data-member-active]").checked;
        const scopeText = member.querySelector("[data-member-scopes]")?.value || "";
        button.disabled = true;

        try {
            await api(`/api/team/${userId}`, {
                method: "PATCH",
                body: JSON.stringify({
                    role,
                    isActive: active,
                    scopes: role === "ministry_leader" ? scopesFromText(scopeText) : []
                })
            });
            await refreshTeamPanel();
        }
        catch (error) {
            window.alert(error.message);
        }
        finally {
            button.disabled = false;
        }
    }

    function renderOwnershipCandidates(team) {
        const select = document.getElementById("rbac-new-owner");
        if (!select) return;
        const candidates = team.filter(member => member.role !== "owner" && member.isActive);
        select.innerHTML = candidates.length
            ? `<option value="">Choose new Ownerâ€¦</option>${candidates.map(member => `<option value="${member.id}">${escapeHtml(member.firstName)} ${escapeHtml(member.lastName)} Â· ${escapeHtml(member.roleLabel)}</option>`).join("")}`
            : `<option value="">No eligible team members</option>`;
    }

    async function updateAdminLimit(event) {
        const maxAdministrators = Number(event.currentTarget.value);
        try {
            await api("/api/access/settings", { method: "PATCH", body: JSON.stringify({ maxAdministrators }) });
            await refreshTeamPanel();
        }
        catch (error) {
            window.alert(error.message);
            await refreshTeamPanel();
        }
    }

    async function transferOwnership() {
        const select = document.getElementById("rbac-new-owner");
        const newOwnerUserId = Number(select?.value || 0);
        if (!newOwnerUserId) return;

        const label = select.options[select.selectedIndex]?.textContent || "this team member";
        if (!window.confirm(`Transfer ownership to ${label}?\n\nYou will automatically become an Administrator.`)) return;

        try {
            const data = await api("/api/ownership/transfer", { method: "POST", body: JSON.stringify({ newOwnerUserId }) });
            window.alert(data.message);
            const me = await api("/api/auth/me");
            currentUser = me.user;
            sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));
            window.location.reload();
        }
        catch (error) {
            window.alert(error.message);
        }
    }

    function showRequiredPasswordChange() {
        if (document.getElementById("rbac-password-overlay")) return;
        const overlay = document.createElement("div");
        overlay.id = "rbac-password-overlay";
        overlay.className = "rbac-overlay";
        overlay.innerHTML = `
            <form id="rbac-password-form" class="rbac-password-card">
                <span class="rbac-kicker">ACCOUNT SECURITY</span>
                <h2>Choose Your Password</h2>
                <p>Your account is using a temporary password. Change it before continuing.</p>
                <label><span>CURRENT / TEMPORARY PASSWORD</span><input id="rbac-current-password" type="password" required autocomplete="current-password"></label>
                <label><span>NEW PASSWORD</span><input id="rbac-new-password" type="password" minlength="12" required autocomplete="new-password"></label>
                <label><span>CONFIRM NEW PASSWORD</span><input id="rbac-confirm-password" type="password" minlength="12" required autocomplete="new-password"></label>
                <div id="rbac-password-message" class="rbac-message"></div>
                <button class="publisher-button" type="submit">CHANGE PASSWORD</button>
            </form>
        `;
        document.body.appendChild(overlay);
        document.getElementById("rbac-password-form").addEventListener("submit", changeRequiredPassword);
    }

    async function changeRequiredPassword(event) {
        event.preventDefault();
        const currentPassword = document.getElementById("rbac-current-password").value;
        const newPassword = document.getElementById("rbac-new-password").value;
        const confirmPassword = document.getElementById("rbac-confirm-password").value;
        const message = document.getElementById("rbac-password-message");

        if (newPassword !== confirmPassword) {
            message.textContent = "New passwords do not match.";
            return;
        }

        try {
            await api("/api/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
            currentUser.mustChangePassword = false;
            sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));
            document.getElementById("rbac-password-overlay")?.remove();
        }
        catch (error) {
            message.textContent = error.message;
        }
    }

    function injectRoleStyles() {
        if (document.getElementById("fnz-rbac-styles")) return;
        const style = document.createElement("style");
        style.id = "fnz-rbac-styles";
        style.textContent = `
            .rbac-role-pill{display:inline-flex;align-items:center;border:1px solid rgba(231,198,95,.55);padding:5px 9px;color:var(--gold-light,#f3dc8a);font-size:.58rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;border-radius:999px;white-space:nowrap}
            .rbac-pending-badge{border:0;background:#e7c65f;color:#2a0a35;padding:9px 11px;font:800 .58rem Montserrat,Arial,sans-serif;letter-spacing:.08em;cursor:pointer;border-radius:3px;white-space:nowrap}
            .rbac-review-panel{margin:26px 0 32px;background:#fff;border:1px solid #d9cfbf;border-top:5px solid var(--gold,#c9a342);padding:24px;box-shadow:0 10px 28px rgba(38,3,49,.07)}
            .rbac-review-heading,.rbac-form-heading,.rbac-team-heading,.rbac-access-summary,.rbac-transfer-box{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}
            .rbac-review-heading h2,.rbac-form-heading h2,.rbac-transfer-box h2{margin:2px 0 0;color:var(--purple-dark,#2a0a35);font-family:"Cormorant Garamond",Georgia,serif;font-size:1.8rem}
            .rbac-kicker{color:var(--purple,#45135b);font-size:.62rem;font-weight:800;letter-spacing:.12em}
            .rbac-count,.rbac-zero,.rbac-scope,.rbac-temp-pill{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:.58rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;background:#f4ecd2;color:#3c2744}
            .rbac-zero{background:#eee;color:#666}.rbac-temp-pill{background:#fff0c8;color:#704b00}
            .rbac-request-list{display:grid;gap:12px;margin-top:18px}.rbac-request{display:flex;align-items:center;justify-content:space-between;gap:18px;border-top:1px solid #ece4d8;padding:16px 0 4px}.rbac-request:first-child{border-top:0}.rbac-request h3{margin:3px 0 4px;color:var(--purple-dark,#2a0a35);font-family:"Cormorant Garamond",Georgia,serif;font-size:1.35rem}.rbac-request p,.rbac-muted{margin:0;color:#6f6872;font-size:.72rem;line-height:1.5}.rbac-request-meta{font-size:.58rem;font-weight:700;letter-spacing:.07em;color:#766d78;text-transform:uppercase}.rbac-request-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:7px}.rbac-request-actions button,.rbac-form-heading button{border:1px solid #c9bfcb;background:#fff;color:#3b2344;padding:8px 10px;font:700 .58rem Montserrat,Arial,sans-serif;letter-spacing:.06em;cursor:pointer}.rbac-request-actions .rbac-primary{background:var(--purple-dark,#2a0a35);border-color:var(--purple-dark,#2a0a35);color:#f2dc91}.rbac-request-actions .rbac-danger{color:#922a2a;border-color:#d8aaaa}
            .rbac-access-summary{align-items:center;background:#fff;border:1px solid #d9cfbf;padding:18px 20px;margin:22px 0}.rbac-access-summary strong{display:block;color:var(--purple-dark,#2a0a35);font-size:1.2rem;margin-top:4px}.rbac-access-summary label,.rbac-form label,.rbac-member-controls label,.rbac-password-card label{display:flex;flex-direction:column;gap:6px;color:var(--purple-dark,#2a0a35);font-size:.6rem;font-weight:800;letter-spacing:.07em}.rbac-access-summary select,.rbac-form input,.rbac-form select,.rbac-member-controls input,.rbac-member-controls select,.rbac-transfer-controls select,.rbac-password-card input{border:1px solid #cec3cf;background:#fff;color:#2a2230;padding:11px 12px;font:500 .78rem Montserrat,Arial,sans-serif;min-width:150px}.rbac-form{background:#fff;border:1px solid #d9cfbf;border-top:5px solid var(--gold,#c9a342);padding:24px;margin-bottom:24px}.rbac-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.rbac-form .rbac-wide{grid-column:1/-1}.rbac-form small{font-size:.62rem;color:#777;font-weight:500;letter-spacing:0}.rbac-message{min-height:18px;margin-top:12px;color:#702222;font-size:.7rem;font-weight:700}
            .rbac-team-list{display:grid;gap:12px}.rbac-member{display:grid;grid-template-columns:minmax(220px,.8fr) minmax(460px,1.6fr);gap:20px;align-items:center;background:#fff;border:1px solid #ded5c7;padding:17px}.rbac-member-identity{display:flex;align-items:center;gap:12px}.rbac-avatar{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--purple-dark,#2a0a35);color:#f2dc91;font:800 .72rem Montserrat,Arial,sans-serif}.rbac-member h3{margin:0;color:var(--purple-dark,#2a0a35);font-family:"Cormorant Garamond",Georgia,serif;font-size:1.3rem}.rbac-member p{margin:3px 0 0;color:#726b75;font-size:.66rem}.rbac-member-controls{display:flex;align-items:flex-end;justify-content:flex-end;gap:10px;flex-wrap:wrap}.rbac-member-controls label{min-width:145px}.rbac-member-controls [data-member-scope-wrap]{min-width:220px}.rbac-active-toggle{min-width:auto!important;align-items:center}.rbac-active-toggle input{min-width:0;width:20px;height:20px}.rbac-owner-label{padding:10px 12px;background:#f4ecd2;color:#38233f}.rbac-transfer-box{align-items:center;margin-top:28px;background:#f4efe5;border-left:5px solid var(--purple-dark,#2a0a35);padding:22px}.rbac-transfer-box p{max-width:600px;color:#6d6670;font-size:.72rem}.rbac-transfer-controls{display:flex;gap:10px;align-items:center}.rbac-awaiting-review{outline:2px solid #c9a342;outline-offset:2px}
            .rbac-overlay{position:fixed;inset:0;z-index:99999;background:rgba(24,8,30,.78);display:grid;place-items:center;padding:20px}.rbac-password-card{width:min(100%,480px);background:#fff;border-top:6px solid var(--gold,#c9a342);padding:30px;box-shadow:0 20px 70px rgba(0,0,0,.35)}.rbac-password-card h2{margin:5px 0 8px;color:var(--purple-dark,#2a0a35);font-family:"Cormorant Garamond",Georgia,serif;font-size:2rem}.rbac-password-card p{color:#6f6872;font-size:.75rem;line-height:1.5}.rbac-password-card label{margin-top:14px}
            [hidden]{display:none!important}
            @media(max-width:850px){.rbac-member{grid-template-columns:1fr}.rbac-member-controls{justify-content:flex-start}.rbac-request,.rbac-transfer-box,.rbac-access-summary{flex-direction:column;align-items:stretch}.rbac-request-actions{justify-content:flex-start}.rbac-transfer-controls{flex-direction:column;align-items:stretch}}
            @media(max-width:600px){.rbac-role-pill{display:none}.rbac-form-grid{grid-template-columns:1fr}.rbac-form .rbac-wide{grid-column:auto}.rbac-review-panel,.rbac-form{padding:18px}.rbac-member-controls{display:grid;grid-template-columns:1fr}.rbac-member-controls label{min-width:0}.rbac-pending-badge{font-size:.52rem}}
        `;
        document.head.appendChild(style);
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, "&#096;");
    }
})();


