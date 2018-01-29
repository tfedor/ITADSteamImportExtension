if (!ITAD || !ITAD.Steam) {

    var ITAD = ITAD || {};

    ITAD.Api = {
        Host: "https://api.isthereanydeal.com/",
        OAuthClientID: ""
    };

    ITAD.URI = (function(){
        var self = {};

        self.parseHash = function(){
            if (!window.location.hash) { return null; }

            var query = {};
            var parts = window.location.hash.substr(1).split("&");
            parts.forEach(function(part){
                var kv = part.split("=");
                query[kv[0]] = decodeURIComponent(kv[1]);
            });
            return query;
        };

        return self;
    })();

    ITAD.User = (function(){

        var self = {};
        var _id = null;
        var _token = null;

        self.isLoggedIn = function() {
            var node = document.querySelector("a[data-miniprofile]");
            if (!node) { return false; }

            _id = node.dataset["miniprofile"];
            return true;
        };

        self.getId = function() {
            return _id;
        };

        self.setToken = function(token){
            _token = token;
            let data = {};
            data[_id + "_token"] = token;
            return browser.storage.local.set(data);
        };
        self.loadToken = function(){
            let key = _id + "_token";
            return browser.storage.local.get(key)
                .then(function(data){
                    if (data) {
                        _token = data[key];
                    }
                });
        };
        self.getToken = function(){
            return _token;
        };

        self.getOAuthUrl = function() {
            // TODO
            return ITAD.Api.Host + "oauth/authorize/"
                + "?client_id=" + ITAD.Api.OAuthClientID
                + "&response_type=token"
                + "&state=itad_"+_id
                + "&scope=wait_read wait_write coll_read coll_write"
                + "&redirect_uri=" + window.location.href;
        };

        self.getSteamData = function() {
            let myRequest = new Request(
                "http://store.steampowered.com/dynamicstore/userdata/?id="+_id,
                {
                    "credentials": "same-origin"
                }
            );

            return fetch(myRequest)
                .then(function(response) {
                    return response.json();
                });
        };

        return self;
    })();

    ITAD.Steam = (function(){

        var self = {};
        var _menuItem;

        self.init = function() {
            console.log("IsThereAnyDeal's Steam Import");

            browser.runtime.onMessage.addListener(messageHandler);

            if (!createMenuContainer()) {
                console.log("ITADSteamImport: Couldn't create menu container");
                return;
            }

            if (!ITAD.User.isLoggedIn()) {

                updateMenu("signin");

            } else {

                var query = ITAD.URI.parseHash();

                if (query && query['access_token'] && query['state'] && query['state'] === "itad_" + ITAD.User.getId()) {
                    ITAD.User.setToken(query['access_token'])
                        .then(updateData);
                } else {
                    ITAD.User.loadToken()
                        .then(function(){
                            if (!ITAD.User.getToken()) {
                                updateMenu("authorize");
                            } else {
                                updateData();
                            }
                        });
                }
            }
        };

        function createMenuContainer() {
            var menu = document.getElementById("global_action_menu");
            if (!menu) { return false; }

            let node = document.getElementById("itad-steam-sync");
            if (node) {
                node.parentNode.removeChild(node);
            }

            _menuItem = document.createElement("div");
            _menuItem.id = "itad-steam-sync";
            menu.insertAdjacentElement("afterbegin", _menuItem);
            return true;
        }

        function updateMenu(state, data) {

            var html = "";
            switch(state) {
                case "signin":
                    html = "Sign in for ITAD sync";
                    break;

                case "authorize":
                    html = "<a href='" + ITAD.User.getOAuthUrl() + "'>Authorize to sync</a>";
                    break;

                case "checking":
                    html = "Checking changes since last import";
                    break;

                case "idle":
                    html = "Steam import ready";
                    break;

                case "finished":
                    let date = new Date(data);
                    let Y = date.getFullYear();
                    let m = ("0" + (date.getMonth() + 1)).slice(-2);
                    let d = ("0" + date.getDate()).slice(-2);
                    let H = ("0" + date.getHours()).slice(-2);
                    let i = ("0" + date.getMinutes()).slice(-2);
                    let s = ("0" + date.getSeconds()).slice(-2);
                    html = "Last import to ITAD: " + Y+"-"+m+"-"+d+" "+H+":"+i+":"+s;
                    break;
            }
            _menuItem.innerHTML = html;
        }

        function updateData() {
            updateMenu("checking");

            ITAD.User.getSteamData()
                .then(function(data){
                    queryServer("data:update", {
                        id: ITAD.User.getId(),
                        token: ITAD.User.getToken(),
                        steam: data
                    })
                })
        }

        function queryServer(message, data) {
            return browser.runtime.sendMessage({
                "type": message,
                "data": data || null
            });
        }

        function messageHandler(request, sender, sendResponse) {
            //console.log(request, sender, sendResponse);
            updateMenu(request.message, request.data);
        }

        return self;
    })();

    ITAD.Steam.init();

}
