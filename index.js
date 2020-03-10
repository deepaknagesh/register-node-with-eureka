const request = require('request');
const ip = require('ip');

const netflixClass = "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo";
const dataCenterInfo = Object.freeze({
    "@class": netflixClass,
    name: `MyOwn`
});
const headers = { 'content-type': 'application/json' };
let registerUrl;
let beatsUrl;

module.exports = {
    register: (eurekaService = "http://localhost:8761", appName = "node-service", port = "3000") => {
        const ipAddress = ip.address();
        const instanceId = `${appName}-${port}`;
        // eurekaService = `${eurekaService}/eureka/v2`;
        registerUrl = `${eurekaService}/apps/${appName}`;
        beatsUrl = `${eurekaService}/apps/${appName}/${instanceId}`;
        console.log(`Registering ${appName} with Eureka`);
        const body = JSON.stringify({
            instance: {
                hostName: `localhost`,
                instanceId: instanceId,
                vipAddress: `${appName}`,
                app: `${appName.toUpperCase()}`,
                ipAddr: ipAddress,
                status: `UP`,
                port: {
                    $: port,
                    "@enabled": true
                },
                dataCenterInfo
            }
        });

        request.post({
            headers,
            url: registerUrl,
            body
        }, (error, response, body) => {
            if (!error) {
                console.log(`Registered with Eureka.`);
                setInterval(() => {
                    request.put({
                        headers,
                        url: beatsUrl
                    }, (error, response, body => {
                        if (error) {
                            console.error('Sending heartbeat to Eureka failed.');
                        } else {
                            console.log('Successfully sent heartbeat to Eureka.');
                        }
                    }));
                }, 50 * 1000);

            } else {
                console.error(`Not registered with eureka due to: ${error}`);
                console.error(`Eureka url: ${eurekaService}`);
            }
        });
    },
    unregister: (cb) => {
        if (!cb || typeof cb !== "function") {
            throw new Error("Call back is required to unregister the service from Eureka.");
        }
        console.log(`Unregistering from Eureka.`);
        request.del({
            headers,
            url: beatsUrl
        }, (error, response, body) => {
            if (error) {
                console.error('Unregistering from Eureka failed.');
                error = new Error('Unregistering from Eureka failed.');
            } else {
                console.log('Successfully unregistered from Eureka.');
                response = 'Successfully unregistered from Eureka.';
            }
            cb(error, response);
        });
    }
};
