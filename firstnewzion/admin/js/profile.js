"use strict";

(() => {
    const rootUrl = "https://fnz-website-api.904degreeslabs.workers.dev";
    const keys = ["churchName", "address", "phone", "email", "website", "about", "mission", "vision", "scheduleSummary"];
    let churchId, busy = false, dirty = false, ready = false;
    document.addEventListener("DOMContentLoaded", async () => {
        const form = document.getElementById("site-profile-form");
        if (!form) return;
        const message = document.getElementById("site-profile-message");
        const publish = document.getElementById("site-profile-publish");
        const save = document.getElementById("site-profile-save");
        const reload = document.getElementById("site-profile-reload");
        const status = text => message.textContent = text;
        const buttons = () => {
            save.disabled = busy || !ready;
            publish.disabled = busy || dirty || !ready;
            reload.disabled = busy || !ready;
        };
        async function api(path, options = {}) {
            const token = sessionStorage.getItem("fnzPublisherToken");
            const response = await fetch(rootUrl + path, { ...options, cache: "no-store", headers: {
                Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {})
            }});
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
            return data;
        }
        const endpoint = action => `/api/publisher/churches/${churchId}/${action}`;
        function populate(data) {
            keys.forEach(key => form.elements.namedItem(key).value = data.church[key] || "");
            dirty = false;
            document.getElementById("site-profile-version").textContent = `${data.state} • publication v${data.version}`;
        }
        async function run(work) {
            busy = true; buttons();
            try { await work(); } catch (error) { status(error.message); }
            finally { busy = false; buttons(); }
        }
        form.addEventListener("input", () => { dirty = true; status("Unsaved changes. Save the draft before publishing."); buttons(); });
        form.addEventListener("submit", event => {
            event.preventDefault();
            if (!ready || busy) return;
            run(async () => {
                const payload = Object.fromEntries(keys.map(key => [key, form.elements.namedItem(key).value.trim()]));
                populate(await api(endpoint("draft"), { method: "PUT", body: JSON.stringify(payload) }));
                status("Draft saved. The website and Client still show the last publication.");
            });
        });
        publish.addEventListener("click", () => {
            if (!ready || busy || dirty) return;
            run(async () => {
                populate(await api(endpoint("publish"), { method: "POST", body: "{}" }));
                status("Published. Reload the public site or reopen Client to see the update.");
            });
        });
        reload.addEventListener("click", () => {
            if (busy || !ready) return;
            if (dirty && !window.confirm("Discard your unsaved edits and load the saved draft?")) return;
            run(async () => { populate(await api(endpoint("draft"))); status("Saved draft reloaded."); });
        });
        buttons();
        await run(async () => {
            const me = await api("/api/auth/me");
            const permissions = me.user?.permissions || [];
            if (!permissions.includes("branding.edit") && !permissions.includes("publication.review")) return;
            churchId = me.user.churchId;
            populate(await api(endpoint("draft")));
            ready = true;
            status("Edit church information, save a draft, then publish when ready.");
        });
    });
})();
