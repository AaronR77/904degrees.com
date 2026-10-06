"use strict";

function fnzProfileAddressLines(value) {
    const address = String(value || "").replace(/\\r\\n|\\n|\\r/g, "\n").replace(/\r\n?/g, "\n").trim();
    if (!address) return [];
    const lines = address.split(/\n+/).map(line => line.trim()).filter(Boolean);
    if (lines.length > 1) return [lines[0], lines.slice(1).join(", ")];
    // Keep apartment/suite commas with the street when a US city/state/ZIP follows.
    const locality = address.match(/^(.*?),\s*([^,]+,\s*[A-Za-z]{2}\s+\d{5}(?:-\d{4})?)$/);
    if (locality) return [locality[1].trim(), locality[2].trim()];
    const comma = address.indexOf(",");
    return comma >= 0 ? [address.slice(0, comma).trim(), address.slice(comma + 1).trim()] : [address];
}

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
            if (typeof value === "string") element.textContent = element.dataset.profile === "address" ? fnzProfileAddressLines(value).join("\n") : value;
        });
        const addressLines = fnzProfileAddressLines(church.address);
        document.querySelectorAll(".fnz-directions").forEach(link => {
            link.dataset.address = church.address;
            const heading = link.querySelector("h2");
            if (heading) {
                heading.textContent = addressLines[0] || "";
                const locality = link.querySelector("p");
                if (locality) locality.textContent = addressLines[1] || "";
            } else {
                link.textContent = addressLines.length ? `⌖ ${addressLines.join("\n")}` : "";
                link.style.whiteSpace = "pre-line";
            }
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
