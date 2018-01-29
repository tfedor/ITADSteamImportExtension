if (!ITAD || !ITAD.Steam) {
    var ITAD = ITAD || {};

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
