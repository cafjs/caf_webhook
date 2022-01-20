/*!
Copyright 2022 Caf.js Labs and contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';
/**
 * Plug for webhook requests.
 *
 *
 * @module caf_webhook/plug_webhook
 * @augments external:caf_components/gen_plug
 *
 */
const assert = require('assert');
const caf_comp = require('caf_components');
const caf_transport = require('caf_transport');
const json_rpc = caf_transport.json_rpc;
const genPlug = caf_comp.gen_plug;
const util = require('util');

exports.newInstance = async function($, spec) {
    try {
        const that = genPlug.create($, spec);

        $._.$.log && $._.$.log.debug('New webhook plug');

        assert.equal(typeof spec.env.webhookMap, 'string',
                     "'spec.env.webhookMap' is not a string");

        assert(json_rpc.splitName(spec.env.webhookMap).length === 3);

        const mapName = spec.env.webhookMap;

        const replicaOfAsync = util.promisify($._.$.sharing.replicaOf);

        let replica = await replicaOfAsync(mapName, {bestEffort: true});

        const publishAsync = util.promisify($._.$.pubsub.publish);

        that.getMapName = () => mapName;

        /*
         * Propagates webhook if registered.
         *
         */
        that.propagate = async function(id, body, signature) {
            const propagateImpl = async () => {
                const ref = replica.ref(true);
                const topic = ref.get(id);
                if (topic) {
                    const msgObj = {id, body};
                    if (signature) {
                        msgObj.signature = signature;
                    }

                    const msg = json_rpc.notification(
                        topic, // to
                        json_rpc.SYSTEM_FROM, // from
                        json_rpc.DEFAULT_SESSION, // session
                        'invalidMethod', //method
                        topic,
                        JSON.stringify(msgObj)
                    );
                    await publishAsync(topic, JSON.stringify(msg));
                } else {
                    $._.$.log && $._.$.log.debug(`Ignoring ${id}, no topic`);
                }
            };

            if (replica) {
                await propagateImpl();
            } else {
                replica = await replicaOfAsync(mapName, {bestEffort: true});
                if (replica) {
                    await propagateImpl();
                } else {
                    throw new Error('No bindings SharedMap');
                }
            }
        };

        return [null, that];
    } catch (err) {
        return [err];
    }
};
