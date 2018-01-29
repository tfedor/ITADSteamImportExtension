if (!ITAD || !ITAD.Plains) {
    var ITAD = ITAD || {};

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
}
