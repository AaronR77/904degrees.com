"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const menuButton =
        document.querySelector(".mobile-menu-button");

    const navLinks =
        document.querySelector(".nav-links");

    if (menuButton && navLinks) {

        menuButton.addEventListener("click", () => {

            navLinks.classList.toggle("open");

            const isOpen =
                navLinks.classList.contains("open");

            menuButton.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );

        });

    }

});