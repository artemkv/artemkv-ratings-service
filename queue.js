"use strict";

const MAX_MESSAGES_IN_MEMORY = 10;

const fs = require('fs');

let _queueDir = `${__dirname}/queue`;
let _modeInMemory = true;

let _counter = 0;
let _queue = [];

function getFileName(ts) {
    return _queueDir + '/' + ts;
}

function getTimeStamp() {
    if (_counter > 1000) {
        _counter = 0;
    }
    return new Date().getTime() * 1000 + _counter++;
}

const push = function push(message) {
    let ts = getTimeStamp();

    let envelope = {
        ts: ts,
        message: message
    };

    if (_modeInMemory) {
        _queue.push(envelope);
        if (_queue.length > MAX_MESSAGES_IN_MEMORY) {
            flushToDiskSync();
            _modeInMemory = false;
        }
    } else {
        fs.writeFileSync(getFileName(ts), JSON.stringify(envelope));
    }
}

function flushToDiskSync() {
    console.log('flushing to disk');
    while (_queue.length > 0) {
        let envelope = _queue.shift();
        fs.writeFileSync(getFileName(envelope.ts), JSON.stringify(envelope));
    }
}

const pop = function pop() {
    if (_modeInMemory) {
        if (_queue.length > 0) {
            return _queue.shift();
        }
        return null;
    } else {
        let files = fs.readdirSync(_queueDir).sort();
        if (files.length == 0) {
            return null;
        }
        if (files.length < MAX_MESSAGES_IN_MEMORY / 2) {
            reloadInMemory(files);
            _modeInMemory = true;
            return _queue.shift();
        } else {
            let envelope = JSON.parse(fs.readFileSync(`${_queueDir}/${files[0]}`, 'utf8'));
            fs.unlinkSync(`${_queueDir}/${files[0]}`);
            return envelope;
        }
    }
}

function reloadInMemory(files) {
    console.log('reloading into memory');
    files.forEach(function (file) {
        let envelope = JSON.parse(fs.readFileSync(`${_queueDir}/${file}`, 'utf8'));
        _queue.push(envelope);
        fs.unlinkSync(`${_queueDir}/${file}`);
    });
}

const peek = function peek() {
    if (_modeInMemory) {
        if (_queue.length > 0) {
            return _queue[0];
        }
        return null;
    } else {
        let files = fs.readdirSync(_queueDir).sort();
        if (files.length == 0) {
            return null;
        }
        return JSON.parse(fs.readFileSync(`${_queueDir}/${files[0]}`, 'utf8'));
    }
}

const initialize = function initialize() {
    if (!fs.existsSync(_queueDir)) {
        fs.mkdirSync(_queueDir);
    }

    let files = fs.readdirSync(_queueDir);
    if (files.length == 0) {
        _modeInMemory = true;
        return MAX_MESSAGES_IN_MEMORY;
    }
    _modeInMemory = false;
    return 0;
}

exports.initialize = initialize;
exports.push = push;
exports.pop = pop;
exports.peek = peek;