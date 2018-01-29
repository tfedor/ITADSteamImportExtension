if (!ITAD || !ITAD.URI) {
    var ITAD = ITAD || {};

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
}
