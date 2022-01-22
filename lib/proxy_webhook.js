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
         * CA. See `pubsub` plugin for method signature.
         * @memberof! module:caf_webhook/proxy_webhook#
         * @alias init
         */
        that.init = function(self, adminHandlerMethod) {
            $._.init(self, adminHandlerMethod);
        };

        /**
         * Tests whether this CA is privileged and manages webhooks.
         *
         * @return {boolean} True if this CA is managing webhooks.
         *
         * @memberof! module:caf_webhook/proxy_webhook#
         * @alias isAdmin
         */
        that.isAdmin = function() {
            return $._.isAdmin();
        };

        /**
         * Helper method to handle registrations by the admin CA.
         *
         * @param {Object} self A reference to the calling CA to access the
         * plugins.
         * @param {string} msg A request to update a webhook binding, i.e.,
         * id -> topic.
         * @param {string} from The authenticated source CA name.
         *
         * @throws Error If called by a CA that is not the admin CA, or
         * with an invalid request.
         *
         * @memberof! module:caf_webhook/proxy_webhook#
         * @alias handleRegistration
         */
        that.handleRegistration = function(self, msg, from) {
            $._.handleRegistration(self, msg, from);
        };

        /**
         * Authenticates and parsers a webhook notification.
         *
         * @param {string} msg A serialized webhook notification.
         *
         * @return {jsonType} A JSON-parsed notification body.
         *
         * @throws Error If message invalid or cannot be authenticated.
         *
         * @memberof! module:caf_webhook/proxy_webhook#
         * @alias handleNotification
         */
        that.handleNotification = function(msg) {
            return $._.handleNotification(msg);
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
         * @param {string} handlerMethod A pubsub target method to handle
         * notifications. See `pubsub` plugin for method signature.
         * @param {string=} secret An optional secret to authenticate webhooks.
         *
         * @memberof! module:caf_webhook/proxy_webhook#
         * @alias register
         */
        that.register = function(self, id, handlerMethod, secret) {
            $._.register(self, id, handlerMethod, secret);
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
         * Deletes webhooks that have been confirmed to be unregistered.
         *
         * @param {Object} self A reference to the calling CA to access
         * plugins.
         *
         * @memberof! module:caf_webhook/proxy_webhook#
         * @alias cleanup
         */
        that.cleanup = function(self) {
            $._.cleanup(self);
        };

        /**
         * List registered webhooks, showing their status.
         *
         * @param {Object} self A reference to the calling CA to access other
         * plugins.
         * @return {Object<string, webhookInfoType>} An object with metadata of
         * registered services. The key is the webhook id.
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
