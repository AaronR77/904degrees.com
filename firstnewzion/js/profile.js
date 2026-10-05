"use strict";

// Apply published values only. Packaged content remains the offline fallback.
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch(`${FNZ_API_URL}/api/site-profile`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!data.ok || data.state !== "published" || !data.church) return;
        const church = data.church;
        document.querySelectorAll("[data-profile]").forEach(element => {
            const value = church[element.dataset.profile];
            if (typeof value === "string") element.textContent = value;
        });
        document.querySelectorAll(".fnz-directions").forEach(link => {
            link.dataset.address = church.address;
            const heading = link.querySelector("h2");
            if (heading) {
                heading.textContent = church.address;
                const locality = link.querySelector("p");
                if (locality) locality.textContent = "";
            } else link.textContent = church.address ? `⌖ ${church.address}` : "";
            link.href = church.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(church.address)}` : "#";
            link.setAttribute("aria-label", church.address ? `Directions to ${church.churchName}` : "Address not supplied");
        });
        document.querySelectorAll("a[href^='tel:']").forEach(link => {
            link.textContent = church.phone ? `☎ ${church.phone}` : "";
            link.href = church.phone ? `tel:${church.phone.replace(/[^+\d]/g, "")}` : "#";
        });
        document.querySelectorAll("[data-profile-email]").forEach(link => {
            link.textContent = church.email;
            link.href = church.email ? `mailto:${church.email}` : "#";
            link.hidden = !church.email;
        });
        const grid = document.querySelector(".worship-grid");
        if (grid && typeof church.scheduleSummary === "string") {
            const templates = Array.from(grid.children);
            grid.replaceChildren();
            church.scheduleSummary.split(/\n+/).map(s => s.trim()).filter(Boolean).forEach((line, i) => {
                const card = templates[Math.min(i, templates.length - 1)].cloneNode(true);
                const parts = line.split(/\s+[—–-]\s+/, 2);
                card.querySelector("h3").textContent = parts.length > 1 ? parts[0] : "WORSHIP WITH US";
                card.querySelector("strong").textContent = parts.length > 1 ? parts[1] : line;
                grid.append(card);
            });
        }
        // Keep the familiar two-line FNZ heading for the original church name.
        if (church.churchName !== "First New Zion Missionary Baptist Church") {
            document.querySelectorAll(".church-name, [data-profile-name]").forEach(e => e.textContent = church.churchName);
            document.querySelectorAll(".church-subtitle, [data-profile-subtitle]").forEach(e => e.textContent = "");
        }
    } catch {
        console.warn("Church profile unavailable; showing packaged church information.");
    }
});
