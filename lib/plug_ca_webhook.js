'use strict';

/**
 * Manages webhook for this CA.
 *
 *
 * @module caf_webhook/plug_ca_webhook
 * @augments external:caf_components/gen_plug_ca
 */
// @ts-ignore: augments not attached to a class
const crypto = require('crypto');
const assert = require('assert');
const caf_comp = require('caf_components');
const myUtils = caf_comp.myUtils;
const genPlugCA = caf_comp.gen_plug_ca;
const json_rpc = require('caf_transport').json_rpc;

const PRIMARY_REGISTRY = 'webhookPrimary';
const REPLICA_REGISTRY = 'webhookReplica';
const HMAC_ALGO = 'sha256';
const ADMIN_TOPIC_NAME = 'forum-webhookAdmin';

const checkPrefix = function(id, from) {
    const splitId = json_rpc.splitName(id);
    const splitFrom = json_rpc.splitName(from);
    assert((splitId.length === 3) &&
           (splitFrom.length === 2) &&
           (splitId[0] === splitFrom[0]) &&
           (splitId[1] === splitFrom[1]), 'Invalid prefix');
};


exports.newInstance = async function($, spec) {
    try {
        const that = genPlugCA.create($, spec);

        const mapName = $._.$.webhook.getMapName();
        const splitMapName = json_rpc.splitName(mapName);
        const webhookCA = json_rpc.joinName(splitMapName[0], splitMapName[1]);
        const webhookMap = splitMapName[2];
        const isAdmin = ($.ca.__ca_getName__() === webhookCA);

        /*
         * The contents of this variable are always checkpointed before
         * any state externalization (see `gen_transactional`).
         */
        that.state = {
            webhooks: {} // webhooks:Object.<string, webhookType>
        };

        // transactional ops
        const target = {
        };

        that.__ca_setLogActionsTarget__(target);

        that.isAdmin = () => isAdmin;

        that.init = function(self, adminHandlerMethod) {
            if (isAdmin && adminHandlerMethod) {
                const primary = self.$.sharing.$[PRIMARY_REGISTRY];
                !primary && self.$.sharing.addWritableMap(PRIMARY_REGISTRY,
                                                          webhookMap);
                self.$.pubsub.subscribe(ADMIN_TOPIC_NAME, adminHandlerMethod);
                self.$.security && self.$.security.addRule(
                    self.$.security.newSimpleRule(adminHandlerMethod)
                );
            }
            const replica = self.$.sharing.$[REPLICA_REGISTRY];
            !replica && self.$.sharing.addReadOnlyMap(REPLICA_REGISTRY, mapName,
                                                      {bestEffort: true});
        };

        that.handleRegistration = function(self, msg, from) {
            if (isAdmin) {
                const primary = self.$.sharing.$[PRIMARY_REGISTRY];
                if (primary) {
                    const {id, topic} = JSON.parse(msg);
                    checkPrefix(id, from);
                    if (topic) {
                        checkPrefix(topic, from);
                        primary.set(id, topic);
                    } else {
                        primary.delete(id);
                    }
                } else {
                    throw new Error('Not initialized');
                }
            } else {
                throw new Error('Admin CA only');
            }
        };

        that.handleNotification = function(msg) {
            const request = JSON.parse(msg);
            const {topic, secret} = that.state.webhooks[request.id];
            if (topic) {
                if (secret) {
                    const authKey = Buffer.from(secret);
                    const hmac = crypto.createHmac(HMAC_ALGO, authKey);
                    const sig = hmac.update(request.body).digest('hex');
                    // TODO: switch to constant time comparison
                    assert(`sha256=${sig}` === request.signature,
                           'Invalid signature');
                }
                return JSON.parse(request.body);
            } else {
                throw new Error('Unknown webhook');
            }
        };

        that.register = function(self, id, handlerMethod, secret) {
            checkPrefix(id, $.ca.__ca_getName__());
            /* Assuming pubsub topic is the same as the id...
               Future implementations may want more flexibility.*/
            const topic = id;
            that.state.webhooks[id] = {topic, secret};
            self.$.pubsub.subscribe(topic, handlerMethod);
            self.$.pubsub.publish(ADMIN_TOPIC_NAME,
                                  JSON.stringify({id, topic}));
        };

        that.unregister = function(self, id) {
            that.init(self);
            checkPrefix(id, $.ca.__ca_getName__());
            const {topic} = that.state.webhooks[id] || {};
            topic && self.$.pubsub.unsubscribe(topic);
            that.state.webhooks[id] = null;
            self.$.pubsub.publish(ADMIN_TOPIC_NAME,
                                  JSON.stringify({id, topic: null}));
        };

        that.cleanup = function(self) {
            const all = that.list(self);
            Object.keys(all).forEach((id) => {
                const val = all[id];
                if (!val.active && (that.state.webhooks[id] === null)) {
                    delete that.state.webhooks[id];
                }
            });
        };

        that.list = function(self) {
            that.init(self);
            const replica = self.$.sharing.$[REPLICA_REGISTRY];
            const result = myUtils.deepClone(that.state.webhooks);
            Object.keys(result).forEach((id) => {
                const info = result[id] || {};
                info.id = id;
                info.authenticated = !!info.secret;
                delete info.secret; // do not leak secret
                if (replica) {
                    info.active = !!replica.get(id);
                }
                result[id] = info;
            });
            return result;
        };

        return [null, that];
    } catch (err) {
        return [err];
    }
};
