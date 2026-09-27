"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       MOBILE NAVIGATION
       ========================================================= */

    const menuButton = document.querySelector(".mobile-menu-button");
    const navLinks = document.querySelector(".nav-links");

    if (menuButton && navLinks) {

        menuButton.addEventListener("click", () => {

            navLinks.classList.toggle("open");

            const isOpen = navLinks.classList.contains("open");

            menuButton.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );

        });
    }


    /* =========================================================
       ACTIVE NAVIGATION
       Highlights the page currently being viewed.
       ========================================================= */

    const currentPath = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const currentPage = params.get("page");

    document.querySelectorAll(".nav-links a").forEach(link => {

        link.classList.remove("active");

        const href = link.getAttribute("href");

        // Homepage
        if (
            (currentPath.endsWith("/") ||
             currentPath.endsWith("/index.html")) &&
            href === "index.html"
        ) {
            link.classList.add("active");
        }

        // Events
        if (
            currentPath.endsWith("/events.html") &&
            href === "events.html"
        ) {
            link.classList.add("active");
        }

        // Placeholder pages
        if (currentPage && href) {

            const linkURL = new URL(
                href,
                window.location.href
            );

            const linkPage =
                linkURL.searchParams.get("page");

            if (linkPage === currentPage) {
                link.classList.add("active");
            }
        }

    });


    /* =========================================================
       HOME BUTTON
       HOME always means TOP OF HOMEPAGE.
       ========================================================= */

    document.querySelectorAll('a[href="index.html"]').forEach(homeLink => {

        homeLink.addEventListener("click", () => {

            sessionStorage.setItem(
                "fnz-force-home-top",
                "true"
            );

            sessionStorage.removeItem(
                "fnz-scroll-" +
                new URL("index.html", window.location.href).pathname
            );

        });

    });

});


/* =============================================================
   PAGE POSITION MEMORY

   Browser BACK:
       restores the visitor's previous position.

   HOME button:
       always returns to the top of the homepage.
   ============================================================= */

(function () {

    const pageKey =
        "fnz-scroll-" + window.location.pathname;

    window.addEventListener("pageshow", function () {

        const isHome =
            window.location.pathname.endsWith("/") ||
            window.location.pathname.endsWith("/index.html");

        const forceHomeTop =
            sessionStorage.getItem("fnz-force-home-top");

        /*
         * HOME was deliberately clicked.
         * Ignore saved homepage position.
         */
        if (isHome && forceHomeTop === "true") {

            sessionStorage.removeItem("fnz-force-home-top");

            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "instant"
            });

            return;
        }

        /*
         * Normal browser navigation/back.
         * Restore previous position.
         */
        const savedPosition =
            sessionStorage.getItem(pageKey);

        if (savedPosition !== null) {

            requestAnimationFrame(function () {

                window.scrollTo({
                    top: parseInt(savedPosition, 10),
                    left: 0,
                    behavior: "instant"
                });

            });

        }

    });


    /*
     * Remember where the visitor was
     * when leaving this page.
     */
    window.addEventListener("pagehide", function () {

        sessionStorage.setItem(
            pageKey,
            window.scrollY.toString()
        );

    });

})();