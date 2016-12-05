var usergoing = {};

$('document').ready(function() {
    $("#search").bind("keypress", function(event) {
        if(event.which == 13) {
            $("login").html("");
            $('ul').html("");
            event.preventDefault();
            getBusiness($("#search").val());
    }
    });
    $("#del").on('click', function() {
        $("#search").val("");
    });
    $(document).on('click', '#goingClick', function(e) {
        $("login").html("");
        var curRest = $(this).attr('name')
        $.get('/addgoing/'+curRest, function(data) {
            var data = JSON.parse(data);
            if (data.loginFail == true) {
                $("#login").html('<i class="material-icons">warning</i>You need to login to do that!');
            } else {
                console.log(data)
            }
        })
    });
})

//perform the api search using my abstracted backend layer
function getBusiness(search) {
    var url = '/api/' +search
    $.get(url, function(data) {
        var bars = data.businesses;
        console.log(bars)
        for (var i = 0; i < bars.length; i++) {
            details(bars[i].id);
        }
    }, 'json')
}

// get reviews and more details about a given restaurant
function details(id) {
    var url = '/details/' + id
    $.get(url, function(data) {
        var name = data.name;
        var review = data.review;
        var image_url = data.image_url;
        var url = data.url
        var going = data.going;
        usergoing[data.id] = data.user;
        var string = '<li class="collection-item avatar">' +
                 '<img src="'+ image_url +'" alt="" class="circle">' +
                  '<a href="'+ url +'>"<span class="title">'+name+'</span></a>'+
                  '<p id="review">'+review+'</p>' +
                  '<a id="goingClick" name="'+data.id+'" class="secondary-content"><span id="going">'+going+'</span> going!</a></li>'
        $("ul").append(string);
    }, 'json')
}