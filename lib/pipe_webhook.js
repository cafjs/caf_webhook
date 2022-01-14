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
 * Processing pipeline for webhooking HTTP requests.
 *
 *
 * @module caf_webhook/pipe_webhook
 * @augments external:caf_platform/gen_pipe
 */

const caf_core = require('caf_core');
const caf_comp = caf_core.caf_components;
const myUtils = caf_comp.myUtils;
const caf_platform = caf_core.caf_platform;
const gen_pipe = caf_platform.gen_pipe;
const request = require('request');
const url = require('url');

exports.newInstance = async function($, spec) {
    try {
        const that = gen_pipe.create($, spec);

        $._.$.log && $._.$.log.debug('New webhook pipe');

        that.__ca_connectSetup__ = function(app) {
            app.use(spec.env.path, function(req, res, next) {
                let pathName = req.url && url.parse(req.url).pathname || '';
                if ($._.$.webhook && pathName) {
                    pathName = pathName.split('/');
                    const prefix = pathName[1]; // e.g., foo-ca1
                    const suffix = pathName.slice(2).join('/');//e.g., path/x.md
                    $._.$.webhook.lookup(prefix, function(err, newURL) {
                        if (err) {
                            $._.$.log &&
                                $._.$.log.debug('Error in lookup ' +
                                                myUtils.errToPrettyStr(err));
                            next();
                        } else {
                            const newReq = request(newURL + '/' + suffix);
                            newReq.on('error', function(err) {
                                if (err) {
                                    $._.$.log && $._.$.log.debug(
                                        'Request error ' +
                                            myUtils.errToPrettyStr(err)
                                    );
                                }
                                next();
                            });
                            req.pipe(newReq).pipe(res);
                        }
                    });
                } else {
                    next();
                }
            });
        };

        return [null, that];
    } catch (err) {
        return [err];
    }
};
