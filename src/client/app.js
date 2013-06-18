requirejs.config({
        "baseUrl": "client",
        "paths": {
            "jquery": "//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min",
            "main": [
                "./main-built",
                "./main"
            ]
        }
    });

// Load the main app module to start the app
requirejs(["main"]);