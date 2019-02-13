"use strict";

const fs = require('fs');
const memdata = require('./memdata');
const queue = require('./queue');
const replication = require('./replication');
const dateTimeUtil = require('@artemkv/datetimeutil');

let _commitLogDir = `${__dirname}/commit_log`;

function getFileName() {
    return './commit_log/' + dateTimeUtil.getSortableDate() + '.log';
}

function logEvent(event, isOriginalEvent) {
    let envelope = {
        isMaster: isOriginalEvent,
        event: event
    };
    fs.appendFile(getFileName(), JSON.stringify(envelope) + "\n", function (err) {
        // In case of errors, data will be lost. This is current limitation
    });
}

const initialize = function initialize(numberToReEnqueue) {
    // Create commit log dir, if doesn't yet exist
    if (!fs.existsSync(_commitLogDir)) {
        fs.mkdirSync(_commitLogDir);
    }

    // Load events // TODO: heavy on memory
    let reQueue = [];
    fs.readdirSync(_commitLogDir).sort().forEach(function (file) {
        console.log(`${dateTimeUtil.getTimeStamp()} Loading ${file}...`);
        let log = fs.readFileSync(`${_commitLogDir}/${file}`, 'utf8');
        let records = log.split("\n");
        for (let i = 0, len = records.length; i < len; i++) {
            let json = records[i];
            if (json) {
                let record = JSON.parse(records[i]);
                memdata.addEvent(record.event);

                //  Keep last n messages to re-equeue
                reQueue.push(record);
                if (reQueue.length > numberToReEnqueue) {
                    reQueue.shift();
                }
            }
        }
    });

    // Re-equeue last n messages
    while (reQueue.length > 0) {
        let envelope = reQueue.shift();
        queue.push(envelope.event);
    }
    replication.trigger();

    console.log(`${dateTimeUtil.getTimeStamp()} All loaded`);
}

const addEvent = function (event, isOriginalEvent) {
    // asynchronously persist on disk in append-only log
    logEvent(event, isOriginalEvent);
    // update in-memory projection
    memdata.addEvent(event);
    // Queue for replication
    if (isOriginalEvent) {
        queue.push(event);
        replication.trigger();
    }
}

exports.initialize = initialize;
exports.addEvent = addEvent;