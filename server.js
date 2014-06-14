"use strict";

var express = require("express"),
    app = express(),
    fluent = require('fluent-logger'),
    monitor,
    access, 
    fatal,
    sendInterval = -1;

function createLogger(name) {
    var logger = fluent.createFluentSender(name);
    logger.on("error", function () {
        console.log("error while connecting to [" + name + "]");
    });
    return logger;
}

monitor = createLogger('monitor');
access = createLogger('access');
fatal = createLogger('fatal');

function stopSendInterval() {
    if (sendInterval !== -1) {
        clearInterval(sendInterval);
        sendInterval = -1;
    }
}

function monitorRps(rps) {
    monitor.emit("info", {"metric":"worker.rps", "value":rps});
}

app.get('/start', function (req, res) {
    var rps = parseInt(req.query.rps || "20", 10),
        rpts = rps / 10;
    stopSendInterval();
    sendInterval = setInterval(function () {
        for (var i = rpts - 1; i >= 0; i--) {
            access.emit("info", "another request happened! [" + i + "]");
        };
    }, 100);
    monitorRps(rps);
    res.send("STARTED");
});

app.get('/stop', function (req, res) {
    stopSendInterval();
    monitorRps(0);
    res.send("STOPPED");
});

app.get('/err', function (req, res) {
    fatal.emit("error", {message:"This is a horrible error", stack: new Error().stack});
    res.send("ERROR SENT");
});

app.listen(80);