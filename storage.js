/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var AWS = require("aws-sdk");

var storage = (function () {
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    /*
     * The User class stores all User states for the user
     */
    function User(session, data) {
        if (data) {
            this.data = data;
        } else {
            this.data = {};
        }
        this._session = session;
    }

    User.prototype = {
        isEmptyScore: function () {
            //check if any one had non-zero score,
            //it can be used as an indication of whether the User has just started
            var allEmpty = true;
            var userData = this.data;
            userData.players.forEach(function (player) {
                if (userData.scores[player] !== 0) {
                    allEmpty = false;
                }
            });
            return allEmpty;
        },
        save: function (callback) {
            //save the User states in the session,
            //so next time we can save a read from dynamoDB
            this._session.attributes.currentUser = this.data;
            dynamodb.putItem({
                TableName: 'AlexaBusTrackerUserData',
                Item: {
                    userId: {
                        S: this._session.user.userId
                    },
                    Data: {
                        S: JSON.stringify(this.data)
                    }
                }
            }, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                }
                if (callback) {
                    callback();
                }
            });
        }
    };

    return {
        loadUser: function (session, callback) {
            if (session.attributes && session.attributes.currentUser) {
                // console.log('get User from session=' + session.attributes.currentUser);
                callback(new User(session, session.attributes.currentUser));
                return;
            }
            dynamodb.getItem({
                TableName: 'AlexaBusTrackerUserData',
                Key: {
                    userId: {
                        S: session.user.userId
                    }
                }
            }, function (err, data) {
                var currentUser;
                if(!session.attributes) session.attributes = {};
                if (err) {
                    currentUser = new User(session);
                    session.attributes.currentUser = currentUser.data;
                    callback(currentUser);
                } else if (data.Item === undefined) {
                    currentUser = new User(session);
                    session.attributes.currentUser = currentUser.data;
                    callback(currentUser);
                } else {
                    currentUser = new User(session, JSON.parse(data.Item.Data.S));
                    session.attributes.currentUser = currentUser.data;
                    callback(currentUser);
                }
            });
        },
        newUser: function (session) {
            return new User(session);
        }
    };
})();
module.exports = storage;