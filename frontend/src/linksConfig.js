/**
 * Centralized links & external resources configuration for MyGPT.
 * 
 * URLs can be updated here. If a URL is empty, null, or "#", it remains
 * an unconfigured destination and is treated as an inactive/informative link
 * rather than routing users to a broken or fake page.
 */

export const footerLinksConfig = {
    brand: {
        name: "MyGPT",
        tagline: "Your AI companion.",
        description: "Think, create and explore with AI.",
    },
    explore: [
        { id: "about", label: "About", url: "" },
        { id: "features", label: "Features", url: "" },
        { id: "contact", label: "Contact", url: "mailto:support@mygpt.local" },
        { id: "privacy", label: "Privacy Policy", url: "" },
        { id: "terms", label: "Terms of Service", url: "" },
    ],
    socials: [
        {
            id: "github",
            name: "GitHub",
            icon: "fa-brands fa-github",
            url: "https://github.com/arpanmallick23",
        },
        {
            id: "linkedin",
            name: "LinkedIn",
            icon: "fa-brands fa-linkedin-in",
            url: "https://www.linkedin.com/in/arpan-mallick-5b3355322/",
        },
        {
            id: "instagram",
            name: "Instagram",
            icon: "fa-brands fa-instagram",
            url: "https://www.instagram.com/arpanmallick23/?hl=en",
        },
        {
            id: "facebook",
            name: "Facebook",
            icon: "fa-brands fa-facebook-f",
            url: "https://www.facebook.com/profile.php?id=100008668004878",
        },
    ],
};
