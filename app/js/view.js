
function mostRecent(ts, time){
    //console.log('times:', times);
    //console.log('time:', time);
    if(ts){
        tobj = ["now", time]
        ts.push(tobj);
        ts.sortBy(function(x,y){ return y});
        idx = ts.indexOf(tobj);
        var most_recent = ts[Math.max(0,idx-1)];
        var next_available = ts.splice(idx,idx+2);
        console.log({"most recent": most_recent, "next available": next_available});
        return {"most recent": most_recent, "next available": next_available}

    }
    return

}




function koView(){
    var self = this;
    self.routes = ko.observableArray([]);
    self.schedule = schedule;
    self.start = ko.observable("");
    self.stop = ko.observable("");
    self.startHandle = ko.observable("Depart");
    self.stopHandle = ko.observable("Arrive");
    self.descending = "fa fa-sort-desc fa-lg";
    self.ascending = "fa fa-sort-asc fa-lg";
    self.isWeekend = ko.observable(isWeekend());
    self.isWeekend.subscribe(function(){
        self.dayType(self.isWeekend() ? "weekend":"weekday");
        self.getRoutes();
    });
    self.refresh = function(){

        self.getRoutes();
    }


    self.Column = function(prop, head, typ){
        var sself = this;
        sself.property = prop;
        sself.type = typ;
        if(prop=="depart"){
            sself.header = ko.computed(function(){
                if(self.start()){
                    return "Depart "+self.start();
                } else {
                    return "Depart"
                }
            });
        } else {
            sself.header = head;
        }
        sself.state = ko.observable("");
        return sself;
    }
    /*
    self.columns = ko.observableArray([
        { property: "wait", header: "Wait (minutes)", type: "number", state: ko.observable("") },
        { property: "tlength", header: "Trip Length (minutes)", type: "number", state: ko.observable("") },
        { property: "depart", header: ko.computed(function(){ return "Depart "+self.start()}), type: "string", state: ko.observable("") },
        { property: "arrive", header: "Arrive", type: "string", state: ko.observable("") }
    ]);*/

    var cols = [
       { property: "bus", header: "Bus", type: "string"},
       { property: "wait", header: "Wait (mins)", type: "number"},
       { property: "tlength", header: "Trip Length (mins)", type: "number"},
       { property: "depart", header: "Depart", type: "string"},
       { property: "arrive", header: "Arrive", type: "string"}
    ];

    self.columns = ko.observableArray(_.map(cols, function(col){
        return new self.Column(col.property, col.header, col.type);
    }));

    self.clearColumnStates = function (selectedColumn) {
        var otherColumns = self.columns().filter(function (col) {
            return col != selectedColumn;
        });
        for (var i = 0; i < otherColumns.length; i++) {
            otherColumns[i].state("");
        }
    };
    self.numberSort = function (column) {
        self.routes(self.routes().sort(function (a, b) {
            var playerA = a[column.property], playerB = b[column.property];
            if (column.state() === self.ascending) {
                return playerA - playerB;
            }
            else {
                return playerB - playerA;
            }
        }));
    };
    self.sortClick = function (column) {
        try {
            // Call this method to clear the state of any columns OTHER than the target
            // so we can keep track of the ascending/descending
            self.clearColumnStates(column);
            // Get the state of the sort type
            if (column.state() === "" || column.state() === self.descending) {
                column.state(self.ascending);
            }
            else {
                column.state(self.descending);
            }

            switch (column.type) {
                case "number":
                    self.numberSort(column);
                    break;

                case "string":
                default:
                    self.stringSort(column);
                    break;
            }

        }
        catch (err) {
            // Always remember to handle those errors that could occur during a user interaction
            console.log(err);
        }
    };

    self.stringSort = function (column) { // Pass in the column object
        self.routes(self.routes().sort(function (a, b) {
            console.log('a[column.property]:', a[column.property]);
            // Set strings to lowercase to sort in a predictive way
            var playerA = a[column.property].toLowerCase(), playerB = b[column.property].toLowerCase();
            if (playerA < playerB) {
                return (column.state() === self.ascending) ? -1 : 1;
            }
            else if (playerA > playerB) {
                return (column.state() === self.ascending) ? 1 : -1;
            }
            else {
                return 0
            }
        }));
    };

    self.deepGet = function (object, path) {
        var paths = path.split('.'),
            current = object;
        for (var i = 0; i < paths.length; ++i) {
            if (current[paths[i]] == undefined) {
                return undefined;
            } else {
                current = current[paths[i]];
            }
        }
        // If the value of current is not a number, return a lowercase string. If it is, return a number.
        return (isNaN(current)) ? current.toLowerCase() : new Number(current);
    };

    self.stations = ko.observable(self.schedule["stations"].sort());

    self.getRoutes = function(){
        var dt = self.dayType(),
            st = self.start(),
            sp = self.stop(),
            timenow = curTime(),
            nowmins = toMins(timenow);

        console.log('for daytype:', dt);

        //for each bus get the next time it comes to the start stop
        trips = [];
        _.each(Object.keys(self.schedule['daytype'][dt]), function(colorId){
            times = self.schedule['daytype'][dt][colorId];
            var pcntr=0;
            if(times){
                console.log("checking bus:"+colorId,times);
                for(var i =0; i<times.length; i++){
                    if(pcntr==2){
                        break;
                    }
                    var station = times[i][0],
                        tmin = times[i][1];
                    if( (station == st) && ((nowmins+300)>tmin) && (tmin>(nowmins-5)) ){
                        var j = i,
                            depart = tmin;
                        while(j<times.length){
                            if(times[j][0]==sp){
                                trips.push({
                                    "bus": colorId,
                                    "depart":minsToNorm(depart),
                                    "arrive": minsToNorm(times[j][1]),
                                    "wait": depart-nowmins,
                                    "tlength":times[j][1]-depart
                                });
                                pcntr++
                                break;
                            }
                            j++;
                        }
                    }
                }
            }
        });
        self.routes(trips);

    }

    self.start = ko.observable(null);
    self.stop = ko.observable(null);
    //var voteable = (age < 18) ? "Too young":"Old enough";
    self.daytypes = ko.observableArray(["weekday", "weekend"]);
    self.dayType = ko.observable((self.isWeekend()) ? "weekend":"weekday");

}

var x = document.getElementById("demo");


function isWeekend(){
    var d = new Date().getDay();
    return (((d==0)||(d==6)));
    //return false;
}

function showPosition(position) {
    lat = position.coords.latitude;
    lon = position.coords.longitude;
    latlon = new google.maps.LatLng(lat, lon)
    mapholder = document.getElementById('mapholder')
    mapholder.style.height = '250px';
    mapholder.style.width = '500px';

    var myOptions = {
    center:latlon,zoom:14,
    mapTypeId:google.maps.MapTypeId.ROADMAP,
    mapTypeControl:false,
    navigationControlOptions:{style:google.maps.NavigationControlStyle.SMALL}
    }

    var map = new google.maps.Map(document.getElementById("mapholder"), myOptions);
    var marker = new google.maps.Marker({position:latlon,map:map,title:"You are here!"});
}


function test(){
    alert("it worked!");
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            x.innerHTML = "User denied the request for Geolocation."
            break;
        case error.POSITION_UNAVAILABLE:
            x.innerHTML = "Location information is unavailable."
            break;
        case error.TIMEOUT:
            x.innerHTML = "The request to get user location timed out."
            break;
        case error.UNKNOWN_ERROR:
            x.innerHTML = "An unknown error occurred."
            break;
    }
}

/*
'M' is statute miles (default)
'K' is kilometers
'N' is nautical miles
*/
function distance(lat1, lon1, lat2, lon2, unit) {
        var radlat1 = Math.PI * lat1/180;
        var radlat2 = Math.PI * lat2/180;
        var radlon1 = Math.PI * lon1/180;
        var radlon2 = Math.PI * lon2/180;
        var theta = lon1-lon2;
        var radtheta = Math.PI * theta/180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist);
        dist = dist * 180/Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit=="K") { dist = dist * 1.609344 }
        if (unit=="N") { dist = dist * 0.8684 }
        return dist;
}


function curTime(){
    var d = new Date();
    var hours = ""+d.getHours();
    var mins = ""+d.getMinutes();
    if(hours.length<2){
        hours="0"+hours;
    }
    if(mins.length<2){
        mins="0"+mins;
    }
    return hours+mins;
}


function toMins(t){
    var tlen = t.length;
    if(tlen==3){
        var hours = t[0];
        var mins = t.slice(-2);
    } else if(tlen==4) {
        var hours = t.slice(0,2);
        var mins = t.slice(2,4);
    } else {
        alert("encountered a time error ["+t+"]");
        return
    }
    var total_mins = (parseInt(hours)*60)+parseInt(mins);
    return total_mins;
}

function minsToNorm(mins){
    var hours = Math.floor(mins/60);
    var remaining = mins-(hours*60);
    hours = ""+hours;
    remaining = ""+remaining;
    if(hours.length<2){
        hours="0"+hours;
    }
    if(remaining.length<2){
        remaining="0"+remaining;
    }
    return hours+remaining;
}
