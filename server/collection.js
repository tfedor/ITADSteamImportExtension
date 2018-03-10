if (!ITAD || !ITAD.Collection) {
    var ITAD = ITAD || {};

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
                                "copies": [{"type": "steam"}],
                                "owned": 1
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
}
