"use strict";

const statusCodes = require('@artemkv/statuscodes');
const statusMessages = require('@artemkv/statusmessages');
const RestError = require('@artemkv/resterror');
const restStats = require('@artemkv/reststats');
const ratingMemData = require('./ratingsmemdata');

const getMyRating = function (req, res, next) {
    if (req.method !== 'GET') {
        throw new RestError(statusCodes.MethodNotAllowed, statusMessages.MethodNotAllowed);
    }

    let userId = req.my.query.uid;
    if (userId) {
        if (typeof userId !== 'string') {
            throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
        }
        validateUserId(userId);
    } else {
        throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
    }

    let bookId = req.my.query.id;
    if (bookId) {
        if (typeof bookId !== 'string') {
            throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
        }
        bookId = validateBookId(bookId);
    } else {
        throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
    }

    let rating = { r: ratingMemData.getUserRating(userId, bookId) };
    let response = JSON.stringify(rating);

    res.statusCode = statusCodes.OK;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader('Cache-Control', 'no-store');
    res.write(response);
    res.end();

    restStats.countRequestByEndpoint("myrating");
    restStats.updateResponseStats(req, res);
}

function validateUserId(userId) {
    // TODO: implement
}

function validateBookId(bookId) {
    let bookIdParsed = bookId * 1;
    if (!bookIdParsed) {
        throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
    }
    return bookIdParsed;
}

exports.getMyRating = getMyRating;