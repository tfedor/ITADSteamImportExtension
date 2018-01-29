if (!ITAD || !ITAD.User) {
    var ITAD = ITAD || {};

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
}
