requirejs.config({
    "baseUrl": "client",
    "paths": {
    }
});

// Load the main app module to start the app
requirejs(["main"]);