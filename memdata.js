"use strict";

let _ingestEvent;

const initialize = function initialize(ingestEvent) {
    _ingestEvent = ingestEvent;
}

const addEvent = function (event) {
    _ingestEvent(event);
}

exports.initialize = initialize;
exports.addEvent = addEvent;