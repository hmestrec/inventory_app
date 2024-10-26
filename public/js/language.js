// language.js
const translations = {
    en: {
        dashboard: "Dashboard",
        products: "Products",
        clients: "Clients",
        locations: "Locations",
        admin: "Admin",
        loginTitle: "Login",
        emailLabel: "Email",
        passwordLabel: "Password",
        loginButton: "Login",
        backLink: "Back to Main",
        addUserTitle: "Add New User",
        // Add more translations here as needed for different pages
    },
    es: {
        dashboard: "Tablero",
        products: "Productos",
        clients: "Clientes",
        locations: "Ubicaciones",
        admin: "Administrador",
        loginTitle: "Iniciar Sesión",
        emailLabel: "Correo Electrónico",
        passwordLabel: "Contraseña",
        loginButton: "Iniciar Sesión",
        backLink: "Volver al Inicio",
        addUserTitle: "Agregar Nuevo Usuario",
        // Add more translations here as needed for different pages
    },
};

function switchLanguage(lang) {
    // Store language preference in localStorage
    localStorage.setItem("preferredLanguage", lang);
    // Update the page content
    updateLanguage(lang);
}

function updateLanguage(lang) {
    // Update text for all elements with a data-translate attribute
    document.querySelectorAll("[data-translate]").forEach(element => {
        const key = element.getAttribute("data-translate");
        if (translations[lang][key]) {
            element.innerText = translations[lang][key];
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Get the preferred language from localStorage, default to 'en'
    const preferredLanguage = localStorage.getItem("preferredLanguage") || "en";
    // Update the language on page load
    updateLanguage(preferredLanguage);
});
