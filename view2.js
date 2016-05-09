

function fListItem(name, checked){
    this.prefix = ko.observable(name[0]);
    this.isFav = ko.observable(checked);
    this.name = ko.observable(name);
    this.toggle = function(){
        if(this.isFav()==true){
            this.isFav(false);
        } else {
            this.isFav(true);
        }
    }
    this.options = function(){
        console.log(ko.toJS(this));
        var dialog = document.querySelector('dialog');
        if(! dialog.showModal){
          dialogPolyfill.registerDialog(dialog);
        }
        dialog.querySelector('.close').addEventListener('click', function() {
            dialog.close();
        });
        dialog.showModal();
    }
}




function ViewModel(){
    var self = this;
    self.stations = ko.observableArray(
        _.map(stations, function(station){
            return new fListItem(station, false);
        })
    );

    self.byLetter = ko.observable(
        _.groupBy(self.stations(), function(station){
            return station.prefix();
        })
    );

    self.testfunc = function(data){
        alert(data);
    }
}

