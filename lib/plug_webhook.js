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
 * Plug for webhook HTTP requests.
 *
 * Properties:
 *
 *      {adminCA: string, webhookingTable: string}
 *
 * where:
 *
 *  * `adminCA` is the local name of the CA that manages the mappings.
 *  * `webhookingTable` is the name of the `SharedMap` in that CA with the
 * mappings.
 *
 * @module caf_webhook/plug_webhook
 * @augments external:caf_components/gen_plug
 *
 */
const assert = require('assert');
const caf_core = require('caf_core');
const caf_comp = caf_core.caf_components;
const caf_transport = caf_core.caf_transport;
const json_rpc = caf_transport.json_rpc;
const genPlug = caf_comp.gen_plug;
const async = caf_comp.async;
const myUtils = caf_comp.myUtils;

exports.newInstance = async function($, spec) {
    try {
        const that = genPlug.create($, spec);

        $._.$.log && $._.$.log.debug('New webhook plug');

        assert.equal(typeof spec.env.adminCA, 'string',
                     "'spec.env.adminCA' is not a string");

        assert.equal(typeof spec.env.webhookingTable, 'string',
                     "'spec.env.webhookingTable' is not a string");

        let mapCache = {};

        /*
         * Looks up a key in SharedMap <owner>-<adminCA>-<webhookingTable>
         *
         * key syntax is <owner>-<localname>
         */
        that.lookup = function(key, cb0) {
            try {
                const mapKey = json_rpc.joinName(json_rpc.splitName(key)[0],
                                                 spec.env.adminCA,
                                                 spec.env.webhookingTable);
                const lookupImpl = function() {
                    const ref = mapCache[mapKey].ref(true);
                    const prefixURL = ref.get(key);
                    if (prefixURL) {
                        cb0(null, prefixURL);
                    } else {
                        const err = new Error('Key not found');
                        err.key = key;
                        cb0(err);
                    }
                };

                if (mapCache[mapKey]) {
                    lookupImpl();
                } else {
                    $._.$.sharing.replicaOf(mapKey, {}, function(err, map) {
                        if (err) {
                            cb0(err);
                        } else {
                            mapCache[mapKey] = map;
                            lookupImpl();
                        }
                    });
                }
            } catch (ex) {
                cb0(ex);
            }
        };

        const super__ca_shutdown__ = myUtils.superior(that, '__ca_shutdown__');
        that.__ca_shutdown__ = function(data, cb0) {
            if (that.__ca_isShutdown__) {
                cb0(null);
            } else {
                async.each(Object.keys(mapCache),
                           function(name, cb1) {
                               try {
                                   $._.$.sharing.unregisterReplica(
                                       name, mapCache[name], cb1
                                   );
                               } catch (ex) {
                                   cb1(ex);
                               }
                           }, function(err) {
                               if (err) {
                                   $._.$.log && $._.$.log.debug(
                                       'Ignoring ' +
                                           myUtils.errToPrettyStr(err)
                                   );
                               }
                               mapCache = {};
                               super__ca_shutdown__(data, cb0);
                           });
            }
        };

        return [null, that];
    } catch (err) {
        return [err];
    }
};
