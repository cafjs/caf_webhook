'use strict';

/**
 *  Proxy that allows a CA to forward webhook notifications to a pubsub topic.
 *
 * @module caf_webhook/proxy_webhook
 * @augments external:caf_components/gen_proxy
 */
// @ts-ignore: augments not attached to a class
const caf_comp = require('caf_components');
const genProxy = caf_comp.gen_proxy;

exports.newInstance = async function($, spec) {
    try {
        const that = genProxy.create($, spec);

        /**
         * Initializes this plugin using a reference to the calling CA.
         *
         * All the other methods implicitly called `init()` if needed, and,
         * in most cases, only the admin CA explicitly calls this method.
         *
         * @param {Object} self A reference to the calling CA to access other
         * plugins.
         * @param {string=} adminHandlerMethod  A handler method for the admin
         * CA.
         * @memberof! module:caf_webhook/proxy_webhook#
         * @alias init
         */
        that.init = function(self, adminHandlerMethod) {
            $._.init(self, adminHandlerMethod);
        };

        /**
         * Helper method to handle registration by the admin CA.
         *
         * It throws if not called by the admin CA.
         *
         * @param {Object} self A reference to the calling CA to access the
         * plugins.
         * @param {string} id An identifier for the webhook. It should be of
         * the form `foo-ca1-xx`, where `foo-ca1` is the name of this CA and
         * `xx` is an arbitrary ASCII letters+numbers name. This id should be
         * included in the target URL of the webhook, e.g.,
         * `https://root-hello.cafjs.com/webhook/${id}`
         * @param {string} topic A private pubsub topic to publish webhook
         * notifications. The owner of this topic should be this CA, e.g.,
         * `foo-ca1-yyy`.
         * @param {string} from The authenticated source CA name.
         *
         * @throws Error If called by a CA that is not the admin CA, or
         * with an invalid topic.
         *
         * @memberof! module:caf_webhook/proxy_webhook#
         * @alias handleRegistration
         */
        that.handleRegistration = function(self, id, topic, from) {
            $._.handleRegistration(self, id, topic, from);
        };

        /**
         * Authenticates and parsers a webhook request.
         *
         * @param {webhookRequestType} request A webhook request.
         *
         * @return {jsonType} A JSON-parsed request body for the request.
         *
         * @throws Error If message invalid or cannot be authenticated.
         *
         * @memberof! module:caf_webhook/proxy_webhook#
         * @alias authenticateAndParse
         */
        that.authenticateAndParse = function(request) {
            return $._.authenticateAndParse(request);
        };


        /**
         * Registers a webhook to forward notifications to a pubsub topic.
         *
         * @param {Object} self A reference to the calling CA to access the
         * pubsub plugin.
         * @param {string} id An identifier for the webhook. It should be of
         * the form `foo-ca1-xx`, where `foo-ca1` is the name of this CA and
         * `xx` is an arbitrary ASCII letters+numbers name. This id should be
         * included in the target URL of the webhook, e.g.,
         * `https://root-hello.cafjs.com/webhook/${id}`
         * @param {string} topic A private pubsub topic to publish webhook
         * notifications. The owner of this topic should be this CA, e.g.,
         * `foo-ca1-yyy`.
         * @param {string=} secret An optional secret to authenticate webhooks.
         *
         * @memberof! module:caf_webhook/proxy_webhook#
         * @alias register
         */
        that.register = function(self, id, topic, secret) {
            $._.register(self, id, topic, secret);
        };

        /**
         * Unregisters a webhook.
         *
         * @param {Object} self A reference to the calling CA to access the
         * pubsub plugin.
         * @param {string} id An identifier for the webhook.
         *
         * @memberof! module:caf_webhook/proxy_webhook#
         * @alias unregister
         */
        that.unregister = function(self, id) {
            $._.unregister(self, id);
        };

        /**
         * List registered webhooks, showing their status.
         *
         * @param {Object} self A reference to the calling CA to access other
         * plugins.
         * @return {Array.<webhookInfoType>} An array with metadata of
         * registered services.
         *
         * @memberof! module:caf_webhook/proxy_webhook#
         * @alias list
         */
        that.list = function(self) {
            return $._.list(self);
        };

        Object.freeze(that);

        return [null, that];
    } catch (err) {
        return [err];
    }
};
