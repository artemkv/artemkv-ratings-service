"use strict";

const RETRY_WAIT_PERIOD = 30000; // 30 seconds
const dotenv = require('dotenv');

dotenv.config();
const PEER_URL = process.env.PEER_URL;

const request = require('request');
const queue = require('./queue');

let _activated = false;

function replicate() {
    let envelope = queue.peek();
    if (envelope) {
        console.log('replicating message ' + JSON.stringify(envelope)); // TODO: debug code

        let options = {
            url: `${PEER_URL}/event?replica=true`,
            headers: {
                'Content-Type': 'application/json'
            },
            body: Buffer.from(JSON.stringify(envelope.message))
        };
        request.post(options, function (err, response, body) {
            if (err) {
                console.log('error replicating message '); // TODO: debug code
                setTimeout(() => {
                    replicate();
                }, RETRY_WAIT_PERIOD);
            } else {
                queue.pop();
                setImmediate(() => {
                    replicate();
                });
            }
        });
    } else {
        console.log('all replicated'); // TODO: debug code
        _activated = false;
    }
}

const trigger = function trigger() {
    if (!PEER_URL) {
        return;
    }

    if (!_activated) {
        _activated = true;
        setImmediate(() => {
            replicate();
        });
    }
}

exports.trigger = trigger;