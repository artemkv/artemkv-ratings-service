"use strict";

// TODO: for now, a simple list, store it the way that is optimal for querying
let _events = [];

const addEvent = function (event) {
    _events.push(event);
}

exports.addEvent = addEvent;