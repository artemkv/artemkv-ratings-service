"use strict";

const statusCodes = require('@artemkv/statuscodes');
const statusMessages = require('@artemkv/statusmessages');
const RestError = require('@artemkv/resterror');
const restStats = require('@artemkv/reststats');
const ratingMemData = require('./ratingsmemdata');

const getBook = function (req, res, next) {
    if (req.method !== 'GET') {
        throw new RestError(statusCodes.MethodNotAllowed, statusMessages.MethodNotAllowed);
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

    let book = { id: bookId, ar: ratingMemData.getAverageRating(bookId) };
    let response = JSON.stringify(book);

    res.statusCode = statusCodes.OK;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.write(response);
    res.end();

    restStats.countRequestByEndpoint("book");
    restStats.updateResponseStats(req, res);
}

function validateBookId(bookId) {
    let bookIdParsed = bookId * 1;
    if (!bookIdParsed) {
        throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
    }
    return bookIdParsed;
}

exports.getBook = getBook;