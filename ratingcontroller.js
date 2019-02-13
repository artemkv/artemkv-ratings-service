"use strict";

const MAX_LENGTH = 200;

const statusCodes = require('@artemkv/statuscodes');
const statusMessages = require('@artemkv/statusmessages');
const RestError = require('@artemkv/resterror');
const restStats = require('@artemkv/reststats');
const readJsonStream = require('@artemkv/readjsonstream');
const commitLog = require('./commitlog');

const postRating = function (req, res, next) {
    if (req.method !== 'POST') {
        throw new RestError(statusCodes.MethodNotAllowed, statusMessages.MethodNotAllowed);
    }
    let contentType = req.headers['content-type'];
    if (contentType !== 'application/json') {
        throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
    }

    let isReplica = false;
    let replica = req.my.query.replica;
    if (replica === 'true') {
        isReplica = true;
    }

    let promise = new Promise(readJsonStream(req, MAX_LENGTH));

    promise
        .then(function (event) {
            console.log(event); // TODO: remove

            let userId = event.uid;
            if (userId) {
                if (typeof userId !== 'string') {
                    throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
                }
                validateUserId(userId);
            } else {
                throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
            }

            let bookId = event.id;
            if (bookId) {
                if (typeof bookId !== 'number') {
                    throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
                }
                validateBookId(bookId);
            } else {
                throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
            }

            let rating = event.r;
            if (rating) {
                if (typeof rating !== 'number') {
                    throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
                }
                validateRating(rating);
            } else {
                throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
            }

            // TODO: if received replica and there is conflicting message on the replication queue,
            // TODO:   discard this message. This will only happen if user changes her mind while
            // TODO:   the system is partitioned and hits 2 different servers with 2 different votes
            commitLog.addEvent(event, !isReplica);

            res.statusCode = statusCodes.OK;
            res.end();

            restStats.countRequestByEndpoint("rating");
            restStats.updateResponseStats(req, res);
        })
        .catch(function (err) {
            next(err);
        });
}

function validateUserId(userId) {
    // TODO: implement
}

function validateBookId(bookId) {
    if (!bookId) {
        throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
    }
}

function validateRating(rating) {
    if (rating !== 1 && rating !== 2 && rating !== 3 && rating !== 4 && rating !== 5) {
        throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
    }
}

exports.postRating = postRating;