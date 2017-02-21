module.exports = {
  "session": {
    "sessionId": "SessionId.c034e287-2ddd-4996-84f6-538a1b7b842b",
    "application": {
      "applicationId": "amzn1.ask.skill.9afbda2f-35a6-44f6-99e2-a866a6c4a771"
    },
    "attributes": {
      "options": {
        "BusRouteNumber": "49",
        "routeDirections": [
          "Northbound",
          "Southbound"
        ],
        "errorType": "missingRouteDirection",
        "isError": true,
        "errorMessage": "Please say what direction you would like to go.",
        "repromptText": "You can say Northbound or Southbound"
      }
    },
    "user": {
      "userId": "amzn1.ask.account.AEZMKZIGXC5OSIJVVS4K2V5O6ZAERSZZSYLGKUXF5MUL3AMM3D33YKZPBWGGDORESRA2NWOSRZMZUU6KWQFJQETX4OJTDK4PBH6SBZVKWVTTDAL2CH6J4V6DCS6GVWCGGXCBHK72T5KLPF34CDBNTDTPYIADPRLJZ5NEU4DHXZ7MKYQQ53UZYAUG5YHDXKXG3ILIQKCCSDYI32I"
    },
    "new": false
  },
  "request": {
    "type": "IntentRequest",
    "requestId": "EdwRequestId.88ef4133-4b9b-4e45-b8a2-055b374b8d7e",
    "locale": "en-US",
    "timestamp": "2017-02-09T03:17:55Z",
    "intent": {
      "name": "BusByRouteIntent",
      "slots": {
        "RouteDirection": {
          "name": "RouteDirection",
          "value": "northbound"
        },
        "BusRouteName": {
          "name": "BusRouteName"
        },
        "BusRouteNumber": {
          "name": "BusRouteNumber"
        },
        "BusStopName": {
          "name": "BusStopName"
        }
      }
    }
  },
  "version": "1.0"
};