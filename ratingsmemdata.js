"use strict";

let _rating_by_user_book = {};
let _ratings_by_book = {};

const updateUserRating = function (userId, bookId, rating) {
    // Update rating by user, book
    let user_rating_by_book = _rating_by_user_book[userId];
    if (!user_rating_by_book) {
        user_rating_by_book = {};
        _rating_by_user_book[userId] = user_rating_by_book;
    }
    let prevRating = user_rating_by_book[bookId];
    user_rating_by_book[bookId] = rating;

    // Update rating by book
    let ratings = _ratings_by_book[bookId];
    if (!ratings) {
        ratings = { avg: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        _ratings_by_book[bookId] = ratings;
    }
    if (prevRating) {
        ratings[prevRating] -= 1;
    }
    ratings[rating] += 1;

    // Recalculate average
    let sum = 0;
    let count = 0;
    for (let rating = 1; rating <= 5; rating++) {
        if (ratings[rating]) {
            sum += rating * ratings[rating];
            count += ratings[rating];
        }
    }
    ratings.avg = sum / count;
}

const getAverageRating = function (bookId) {
    let averageRating = 0;
    let ratings = _ratings_by_book[bookId];
    if (ratings && ratings.avg) {
        averageRating = ratings.avg;
    }
    return averageRating;
}

const getUserRating = function (userId, bookId) {
    let user_rating_by_book = _rating_by_user_book[userId];
    if (!user_rating_by_book) {
        return 0;
    }
    let rating = user_rating_by_book[bookId];
    if (!rating) {
        return 0;
    }
    return rating;
}

const ingestEvent = function ingestEvent(event) {
    updateUserRating(event.uid, event.id, event.r);
}

exports.updateUserRating = updateUserRating;
exports.getUserRating = getUserRating;
exports.getAverageRating = getAverageRating;
exports.ingestEvent = ingestEvent;
