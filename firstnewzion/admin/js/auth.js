"use strict";


const API_URL =
    "https://fnz-website-api.904degreeslabs.workers.dev";


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const existingToken =
            sessionStorage.getItem(
                "fnzPublisherToken"
            );

        /*
         * If this browser already has a session,
         * verify it before showing login again.
         */
        if (existingToken) {
            verifyExistingSession(
                existingToken
            );
        }


        const form =
            document.getElementById(
                "login-form"
            );

        form.addEventListener(
            "submit",
            handleLogin
        );
    }
);


/* =========================================================
   LOGIN
   ========================================================= */

async function handleLogin(event) {

    event.preventDefault();


    const email =
        document
            .getElementById("email")
            .value
            .trim();


    const password =
        document
            .getElementById("password")
            .value;


    const button =
        document.getElementById(
            "login-button"
        );


    const errorBox =
        document.getElementById(
            "login-error"
        );


    errorBox.textContent = "";

    button.disabled = true;
    button.textContent = "SIGNING IN...";


    try {

        const response =
            await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            email,
                            password
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to sign in."
            );
        }


        sessionStorage.setItem(
            "fnzPublisherToken",
            data.token
        );


        sessionStorage.setItem(
            "fnzPublisherUser",
            JSON.stringify(data.user)
        );


        window.location.href =
            "dashboard.html";

    }
    catch (error) {

        console.error(error);

        errorBox.textContent =
            error.message ||
            "Unable to sign in.";

    }
    finally {

        button.disabled = false;

        button.textContent =
            "SIGN IN";
    }
}


/* =========================================================
   VERIFY EXISTING SESSION
   ========================================================= */

async function verifyExistingSession(token) {

    try {

        const response =
            await fetch(
                `${API_URL}/api/auth/me`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (!response.ok) {

            sessionStorage.removeItem(
                "fnzPublisherToken"
            );

            sessionStorage.removeItem(
                "fnzPublisherUser"
            );

            return;
        }


        const data =
            await response.json();


        sessionStorage.setItem(
            "fnzPublisherUser",
            JSON.stringify(data.user)
        );


        window.location.href =
            "dashboard.html";

    }
    catch (error) {

        console.error(
            "Session verification failed:",
            error
        );
    }
}