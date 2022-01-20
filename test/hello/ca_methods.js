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

const assert = require('assert');

const WEBHOOK_TOPIC = 'topic';

exports.methods = {
    async __ca_init__() {
        this.state.value = 0;
        this.$.log.debug("++++++++++++++++Calling init");
        this.$.webhook.init(this, '__ca_admin_handler__');
        if (!this.$.webhook.isAdmin()) {
            const id = this.__ca_getName__() + '-' + WEBHOOK_TOPIC;
            this.$.webhook.register(this, id, '__ca_handle_notification__');
        }
        return [];
    },

    async __ca_admin_handler__(topic, msg, from) {
        assert(this.$.webhook.isAdmin());
        this.$.log.debug(`handle admin ${topic} ${msg} ${from}`);
        this.$.webhook.handleRegistration(this, msg, from);
        return [];
    },

    async __ca_handle_notification__(topic, msg, from) {
        this.$.log.debug(`handle notif ${topic} ${msg} ${from}`);
        const {value} = this.$.webhook.handleNotification(msg);
        this.state.value = value;
        return [];
    },

    async hello() {
        return [];
    },

    async listWebhooks() {
        return [null, this.$.webhook.list(this)];
    },

    async getValue() {
        return [null, this.state.value];
    },

};
