'use strict';

const hello = require('./hello/main.js');
const app = hello;
const caf_core = require('caf_core');
const myUtils = caf_core.caf_components.myUtils;
const async = caf_core.async;
const cli = caf_core.caf_cli;
const fetch = require('node-fetch');


const CA_OWNER_1='root';
const CA_OWNER_2='foo';
const CA_LOCAL_NAME_1='admin';
const CA_LOCAL_NAME_2='foo';
const TOPIC_SUFFIX = 'topic';
const TOPIC_BAD_SUFFIX = 'topicBAD';
const FROM_1 = CA_OWNER_1 + '-' + CA_LOCAL_NAME_1;
const FROM_2 = CA_OWNER_2 + '-' + CA_LOCAL_NAME_2;
const TOPIC = FROM_2 + '-' + TOPIC_SUFFIX;
const TOPIC_BAD = FROM_2 + '-' + TOPIC_BAD_SUFFIX;

const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

process.on('uncaughtException', function (err) {
               console.log("Uncaught Exception: " + err);
               console.log(myUtils.errToPrettyStr(err));
               process.exit(1);

});

const postIt = async function(topic, value) {
    const res = await fetch('http://127.0.0.1:3000/webhook/' + topic, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
        },
        body: value,
    });
    const data = await res.json();
    console.log(data);
    return data;
};

module.exports = {
    setUp(cb) {
       const self = this;
        app.init( {name: 'top'}, 'framework.json', null,
                      function(err, $) {
                          if (err) {
                              console.log('setUP Error' + err);
                              console.log('setUP Error $' + $);
                              // ignore errors here, check in method
                              cb(null);
                          } else {
                              self.$ = $;
                               cb(err, $);
                          }
                      });
    },

    tearDown(cb) {
        const self = this;
        if (!this.$) {
            cb(null);
        } else {
	    console.log('********');
            this.$.top.__ca_graceful_shutdown__(null, cb);
        }
    },

    async forward(test) {
        test.expect(4);
        var s1;
        const from1 = FROM_1;
        const from2 = FROM_2;

        try {
            // Set up admin
            s1 = new cli.Session('ws://root-webhook.vcap.me:3000',
                                 from1, {from : from1});
            await new Promise((resolve, reject) => {
                s1.onopen = async function() {
                    try {
                        const res = await s1.hello().getPromise();
                        resolve(res);
                    } catch (err) {
                        test.ok(false, 'Got exception ' + err);
                        reject(err);
                    }
                };
            });
            await new Promise((resolve, reject) => {
                s1.onclose = function(err) {
                    test.ifError(err);
                    resolve(null);
                };
                s1.close();
            });

            await setTimeoutPromise(100);

            // Init foo
            s1 = new cli.Session('ws://root-webhook.vcap.me:3000',
                                 from2, {from : from2});
            await new Promise((resolve, reject) => {
                s1.onopen = async function() {
                    try {
                        const res = await s1.register().getPromise();
                        resolve(res);
                    } catch (err) {
                        test.ok(false, 'Got exception ' + err);
                        reject(err);
                    }
                };
            });

            await setTimeoutPromise(100);

            await postIt(TOPIC, "{value: 15}");

            await setTimeoutPromise(100);

            let res = await s1.getValue().getPromise();

            test.ok(res === 15);

            await postIt(TOPIC_BAD, "{value: 30}");

            await setTimeoutPromise(100);

            res = await s1.getValue().getPromise();

            test.ok(res !== 30);

            await setTimeoutPromise(100);

            await new Promise((resolve, reject) => {
                s1.onclose = function(err) {
                    test.ifError(err);
                    resolve(null);
                };
                s1.close();
            });

            test.done();
        } catch (err) {
            test.ifError(err);
            test.done();
        }
    }
};
