if (!ITAD || !ITAD.Waitlist) {
    var ITAD = ITAD || {};

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
}
