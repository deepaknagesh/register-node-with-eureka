const request = require('request');
const ip = require('ip');

const netflixClass = "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo";
const dataCenterInfo = Object.freeze({
    "@class": netflixClass,
    name: `MyOwn`
});
const headers = { 'content-type': 'application/json' };

module.exports = {
    registerWithEureka: (eurekaService = "http://localhost:8761", appName = "node-service", port = "3000") => {
        const registerUrl = `${eurekaService}/apps/${appName}`;
        const heartBeatUrl = `${eurekaService}/apps/${appName}/${appName}-${port}`;
        console.log(`Registering ${appName} with Eureka`);
        request.post({
            headers,
            url: registerUrl,
            body: JSON.stringify({
                instance: {
                    hostName: `localhost`,
                    instanceId: `${appName}-${port}`,
                    vipAddress: `${appName}`,
                    app: `${appName.toUpperCase()}`,
                    ipAddr: ip.address(),
                    status: `UP`,
                    port: {
                        $: port,
                        "@enabled": true
                    },
                    dataCenterInfo
                }
            })
        },
            (error, response, body) => {
                if (!error) {
                    console.log(`Registered with Eureka.`);
                    setInterval(() => {
                        request.put({
                            headers,
                            url: heartBeatUrl
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
    }
};