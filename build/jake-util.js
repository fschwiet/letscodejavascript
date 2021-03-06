exports.extendTask = function(task, jake) {

    var taskRuntimes = [];

    var tracedTask = function(name) {
        var result = task.apply(this, arguments);
        var start;

        result.addListener('start', function() {
            console.log("\nExecuting " + name);
            start = new Date().getTime();
        });

        result.addListener('complete', function() {
            taskRuntimes.push({
                    task: name,
                    ms: new Date().getTime() - start
                });
        });

        return result;
    };
    jake.addListener('complete', function() {
        console.log("Execution time summary");
        taskRuntimes.forEach(function(value) {
            console.log("  " + value.task + " (" + value.ms + "ms)");
        });


        // BUGBUG:  needed this as jake was't exiting on its own.
        //  It seems running the server in process and doing auth against it
        //  is leaking something.
        //
        //  MySQl connection pooling is probably keeping the process too.
        process.exit();
    });

    return tracedTask;
};