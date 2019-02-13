"use strict";

const dotenv = require('dotenv');
const connect = require('connect');
const favicon = require('serve-favicon');
const restStats = require('@artemkv/reststats');
const errorHandler = require('@artemkv/errorhandler');
const myRequest = require('@artemkv/myrequest');
const health = require('@artemkv/health');
const logger = require('@artemkv/logger');
const version = require('./myversion');
const myRatingController = require('./myratingcontroller');
const ratingController = require('./ratingcontroller');
const bookController = require('./bookController');
const booksController = require('./booksController');
const commitLog = require('./commitlog');
const queue = require('./queue');
const memData = require('./memdata');
const ratingMemData = require('./ratingsmemdata');

dotenv.config();

let server = connect();

server
    // Count request
    .use(restStats.countRequest)

    // favicon
    .use(favicon('./favicon.ico'))

    // Assemble my request
    .use(myRequest)

    // Used for testing / health checks
    .use('/health', health.handleHealthCheck)
    .use('/error', errorHandler.handleError)
    .use('/resterror', errorHandler.handleRestError)

    // Log session
    .use(function (req, res, next) {
        logger.logSession(req.my.path);
        return next();
    })

    // Statistics endpoint
    .use('/stats', restStats.getStats)

    // Do business
    .use('/rating', ratingController.postRating)
    .use('/myrating', myRatingController.getMyRating)
    .use('/book', bookController.getBook)
    .use('/books', booksController.getBooks)

    // Handles errors
    .use(function (err, req, res, next) {
        console.log(err);
        logger.logFailedRequest(req, res, err);
        next(err);
    })
    .use(errorHandler.handle404)
    .use(errorHandler.catchAll);

// Start the server
let env = process.env;
let port = env.NODE_PORT || 8000;
let ip = env.NODE_IP || 'localhost';
server.listen(port, ip, function () {
    console.log('Application started');
    console.log('http://' + ip + ":" + port + '/');

    logger.initialize(`${__dirname}/log`);
    logger.log('Application started: http://' + ip + ":" + port + '/');

    restStats.initialize(version);

    memData.initialize(ratingMemData.ingestEvent);

    let numberToReEnqueue = queue.initialize();
    commitLog.initialize(numberToReEnqueue);
});