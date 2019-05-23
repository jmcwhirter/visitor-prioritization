'use strict';
/*
 * A flag indicating whether the origin is ready to accept traffic. It's
 * a static value for this example, but you could instead read the value
 * from an S3 bucket with restricted access, a DynamoDB table,
 * or the CloudFront cache.
 */
const originAcceptingTraffic = true;

/*
 * The origin hit rate (a value between 0 and 1) specifies a percentage of
 * users that go directly to the origin, while the rest go to
 * a "waiting room." Premium users always go to the origin. If you want
 * to adjust traffic dynamically, you can store and retrieve the origin
 * hit rate value from an S3 bucket, a DynamoDB table, or the CloudFront
 * cache.
 */
const originHitRate = 0;

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;

    if (!shouldGoToOrigin(request)) {
        setupWaitingRoom(request);
    }

    callback(null, request);
};

function shouldGoToOrigin(request) {
    if (!originAcceptingTraffic) {
        console.log("Origin is not accepting any traffic. " +
                    "All requests go to the waiting room.");
        return false;
    }
    if (isPremiumUser(request.headers.cookie)) {
        console.log("A premium user goes to the origin.");
        return true;
    }
    if (Math.random() <= originHitRate) {
        console.log("A lucky user goes to the origin.");
        return true;
    }

    console.log("An unlucky user goes to the waiting room.");
    return false;
}

function isPremiumUser(cookies) {
    /*
     * You can replace the static cookie value here with
     * your own custom authentication logic.
     */
    const premiumUserCookieName = 'premium-user-cookie';
    const premiumUserCookieValue = 'some-secret-cookie-value';
    const parsedCookies = parseCookies(cookies);

    if (parsedCookies[premiumUserCookieName] &&
        parsedCookies[premiumUserCookieName] === premiumUserCookieValue) {
        console.log(`Cookie "${premiumUserCookieName}" has ` +
                    `a valid secret value of "${premiumUserCookieValue}".`);
        return true;
    }

    return false;
}

function setupWaitingRoom(request) {
    const waitingRoomS3 = 'your-waiting-room-bucket.s3.amazonaws.com';
    request.origin = {
        s3: {
            domainName: waitingRoomS3,
            region: '',
            authMethod: 'none',
            path: '/waitingroom',
            customHeaders: {}
        }
    };
    request.headers['host'] = [{ key: 'host', value: waitingRoomS3 }];
    request.uri = '/please-try-again.html';
}

function parseCookies(cookies) {
    cookies = cookies || [];
    let parsed = {};
    for (let hdr of cookies) {
        for (let cookie of hdr.value.split(';')) {
            const kv = cookie.split('=');
            if (kv[0] && kv[1]) {
                parsed[kv[0].trim()] = kv[1].trim();
            }
        }
    }
    return parsed;
}
