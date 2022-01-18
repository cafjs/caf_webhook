'use strict';

/**
 * Manages webhooks for this CA.
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

exports.newInstance = async function($, spec) {
    try {
        const that = genPlugCA.create($, spec);

        assert.equal(typeof spec.env.webhookCA, 'string',
                     "'spec.env.webhookCA' is not a string");

        const isAdmin = ($.ca.__ca_getName__() === spec.env.webhookCA);

        assert.equal(typeof spec.env.webhookMap, 'string',
                     "'spec.env.webhookMap' is not a string");

        const mapName = json_rpc.joinName(spec.env.webhookCA,
                                          spec.env.webhookMap);

        assert.equal(typeof spec.env.webhookTopic, 'string',
                     "'spec.env.webhookTopic' is not a string");

        const topicName = json_rpc.joinName(spec.env.webhookTopic,
                                            spec.env.webhookTopic);

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

        that.init = function(self, adminHandlerMethod) {
            if (isAdmin && adminHandlerMethod) {
                const primary = self.$.sharing.$[PRIMARY_REGISTRY];
                !primary && self.$.sharing.addWritableMap(PRIMARY_REGISTRY,
                                                          spec.env.webhookMap);
                self.$.pubsub.subscribe(topicName, adminHandlerMethod);
                self.$.security.addRule(
                    self.$.security.newSimpleRule(adminHandlerMethod)
                );
            }
            const replica = self.$.sharing.$[REPLICA_REGISTRY];
            !replica && self.$.sharing.addReadOnlyMap(REPLICA_REGISTRY, mapName,
                                                      {bestEffort: true});
        };

        that.handleRegistration = function(self, id, topic, from) {
            if (isAdmin) {
                const primary = self.$.sharing.$[PRIMARY_REGISTRY];
                if (primary) {
                    const splitId = json_rpc.splitName(id);
                    const splitTopic = json_rpc.splitName(topic);
                    const splitFrom = json_rpc.splitName(from);
                    assert((splitId[0] === splitFrom[0]) &&
                           (splitId[1] === splitFrom[1]),
                           'Invalid topic (From)');
                    assert((splitId.length === 3) &&
                           (splitTopic.length === 3) &&
                           (splitId[0] === splitTopic[0]) &&
                           (splitId[1] === splitTopic[1]), 'Invalid topic');
                    primary.set(id, topic);
                } else {
                    throw new Error('Not initialized');
                }
            } else {
                throw new Error('Admin CA only');
            }
        };

        that.authenticateAndParse = function(request) {
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

        that.register = function(self, id, topic, secret) {
            that.init(self);
        };

        that.unregister = function(self, id) {
            that.init(self);
        };

        that.list = function(self) {
            that.init(self);
            const replica = self.$.sharing.$[REPLICA_REGISTRY];
            const result = myUtils.deepClone(that.state.webhooks);
            Object.keys(result).forEach((id) => {
                const info = result[id];
                info.secret = !!info.secret; // do not leak secret
                if (replica) {
                    info.active = !!replica.get(id);
                }
            });
        };

        return [null, that];
    } catch (err) {
        return [err];
    }
};
