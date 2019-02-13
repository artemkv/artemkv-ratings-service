"use strict";

const MAX_LENGTH = 100000; // ~100 KB

const statusCodes = require('@artemkv/statuscodes');
const statusMessages = require('@artemkv/statusmessages');
const RestError = require('@artemkv/resterror');
const restStats = require('@artemkv/reststats');
const readJsonStream = require('@artemkv/readjsonstream');
const ratingMemData = require('./ratingsmemdata');

const getBooks = function (req, res, next) {
    if (req.method !== 'POST') {
        throw new RestError(statusCodes.MethodNotAllowed, statusMessages.MethodNotAllowed);
    }
    let contentType = req.headers['content-type'];
    if (contentType !== 'application/json') {
        throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
    }

    let promise = new Promise(readJsonStream(req, MAX_LENGTH));

    promise
        .then(function (json) {
            let bookIdsRequested = json.books;
            if (!bookIdsRequested) {
                throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
            }
            if (!Array.isArray(bookIdsRequested)) {
                throw new RestError(statusCodes.BadRequest, statusMessages.BadRequest);
            }
            let bookRatings = {
                books: bookIdsRequested.map(id => { return { id: id, ar: ratingMemData.getAverageRating(id) }; })
            };
            let response = JSON.stringify(bookRatings);

            res.statusCode = statusCodes.OK;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader('Cache-Control', 'public, max-age=120');
            res.write(response);
            res.end();

            restStats.countRequestByEndpoint("books");
            restStats.updateResponseStats(req, res);
        })
        .catch(function (err) {
            next(err);
        });
}

exports.getBooks = getBooks;