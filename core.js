if (!ITAD || !ITAD.Server) {
    var ITAD = ITAD || {};

    ITAD.Api = {
        Host: "https://api.isthereanydeal.com/",
        Key: ""
    };

    ITAD.Plains = (function(){

        function load(data) {
            if (!data || data.length === 0) {
                return (new Promise(function(resolve, reject) { resolve([]); }));
            }

            let myRequest = new Request(ITAD.Api.Host + "/v01/game/plain/id/?key=" + ITAD.Api.Key + "&shop=steam",
                {
                    "method": "POST",
                    "body": JSON.stringify(data)
                }
            );

            return fetch(myRequest)
                .then(response => response.json())
                .then(json => Object.values(json.data))
                .then(plains => plains.filter(value => value != null));
        }

        let self = {};
        self.fromApps = function(list) { return load(list.map(id => "app/" + id)); };
        self.fromSubs = function(list) { return load(list.map(id => "sub/" + id)); };
        return self;
    })();

    ITAD.Waitlist = (function(){

        function Waitlist(token) {
            this.token = token;
        }

        Waitlist.prototype.import = function(plains) {
            if (plains.length === 0) {
                return new Promise(function(resolve, reject) { resolve(false); });
            }
            console.log("Importing into Waitlist", plains);

            let myRequest = new Request(
                ITAD.Api.Host + "/v01/waitlist/import/?access_token=" + this.token,
                {
                    "method": "POST",
                    "body": JSON.stringify({
                        "version": "02",
                        "data": plains.map(function(plain){
                            return {
                                "plain": plain,
                                "title": plain, //TODO
                            }
                        })
                    })
                }
            );
            return fetch(myRequest)
                .then(function(response) {
                    console.log(response);
                });
        };

        return Waitlist;
    })();

    ITAD.Collection = (function(){

        function Collection(token) {
            this.token = token;
        }

        Collection.prototype.import = function(plains) {
            if (plains.length === 0) {
                return new Promise(function(resolve, reject) { resolve(false); });
            }
            console.log("Importing into Collection", plains);

            let myRequest = new Request(
                ITAD.Api.Host + "/v01/collection/import/?access_token=" + this.token,
                {
                    "method": "POST",
                    "body": JSON.stringify({
                        "version": "02",
                        "data": plains.map(function(plain){
                            return {
                                "plain": plain,
                                "title": plain, //TODO
                                "copies": [{"type": "steam"}]
                            }
                        })
                    })
                }
            );
            return fetch(myRequest)
                .then(function(response) {
                    console.log(response);
                });
        };

        return Collection;
    })();

    ITAD.Server = (function(){
        let self = {};

        function getNewData(oldData, newData, key) {
            if (newData[key] && Array.isArray(newData[key])) {
                if (oldData[key] && Array.isArray(oldData[key])) {
                    return newData[key].filter(value => oldData[key].indexOf(value) < 0);
                } else {
                    return newData[key];
                }
            }
            return [];
        }

        function updateData(data) {
            let diff;

            let id = data.id;
            let token = data.token;
            let steam = data.steam;

            let waitlist = new ITAD.Waitlist(token);
            let collection = new ITAD.Collection(token);

            let dataKey = id + "_data";
            return browser.storage.local.get(dataKey)
                .then(function(stored){
                    let lastImportData = stored[dataKey] || {};
                    let promises = [];

                    diff = getNewData(lastImportData, steam, "rgWishlist");
                    if (diff.length > 0) {
                        promises.push(ITAD.Plains.fromApps(diff).then(function (plains) {
                            waitlist.import(plains);
                        }));
                    }

                    diff = getNewData(lastImportData, steam, "rgOwnedApps");
                    if (diff.length > 0) {
                        promises.push(ITAD.Plains.fromApps(diff).then(function(plains){
                            collection.import(plains);
                        }));
                    }

                    diff = getNewData(lastImportData, steam, "rgOwnedPackages");
                    if (diff.length > 0) {
                        promises.push(ITAD.Plains.fromSubs(diff).then(function(plains){
                            collection.import(plains);
                        }));
                    }

                    if (promises.length > 0) {
                        let store = {};
                        store[dataKey] = steam;
                        store[id + "_timestamp"] = Date.now();
                        promises.push(browser.storage.local.set(store));
                    }

                    return Promise.all(promises);
                });
        }

        function messageHandler(request, sender, sendResponse) {
            console.log("Received message", request);

            if (request && request.type) {
                let response = null;

                switch(request.type) {
                    case "data:update":
                        updateData(request.data)
                            .then(function(){
                                let timestampKey = request.data.id + "_timestamp";
                                browser.storage.local.get(timestampKey)
                                    .then(function(data){
                                        browser.tabs.sendMessage(sender.tab.id, {
                                            "message": "finished",
                                            "data": data[timestampKey]
                                        });
                                    });
                            });
                        break;
                }

                if (response != null) { sendResponse({"response": response}); }
            }
        }

        self.init = function() {
            browser.runtime.onMessage.addListener(messageHandler);
        };

        return self;
    })();

    ITAD.Server.init();
}
