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
"use strict";

exports.methods = {
    "__ca_init__" : function(cb) {
        this.$.log.debug("++++++++++++++++Calling init");
        this.$.sharing.addWritableMap('forwarding', 'forwarding');
        cb(null);
    },
    setBinding : function(key, value, cb) {
        var $$ = this.$.sharing.$;
        $$.forwarding.set(key, value);
        cb(null);

    },
    deleteBinding: function(key, cb) {
        var $$ = this.$.sharing.$;
        $$.forwarding.delete(key);
        cb(null);
    }

};
