var usergoing = {};

$("#search").bind("keypress", function(event) {
        if(event.which == 13) {
            usergoing = {};
            Cookies.set('searched', true);
            $("#login").html("");
            $('ul').html("");
            event.preventDefault();
            $("#loader").show();
            getBusiness($("#search").val());
    }
});

$(document).ready(function() {
    $("#loader").hide();
    if (Cookies.get('search') && Cookies.get('login')) {
        Cookies.remove('login');
        $("#search").val(Cookies.get('search'));
        if (Cookies.get('searched') == 'true') {
            Cookies.remove('searched');
            usergoing = {};
            $("#login").html("");
            $('ul').html("");
            event.preventDefault();
            $("#loader").show();
            getBusiness($("#search").val());
        }
    }
    $("#del").on('click', function() {
        $("#search").val("");
    });
    $("#fb").on('click', function() {
        Cookies.set('search', $("#search").val());
        Cookies.set('login', true);
        window.location.href = '/auth/facebook';
    });
    $(document).on('click', '#goingClick', function(e) {
        $("#login").html("");
        var curRest = $(this).attr('name')
        if ($("#fb").text().toLowerCase() == "login with facebook") {
             $("#login").html('<i class="material-icons">warning</i>You need to login to do that!');
             return;
        } else {
            if (usergoing[curRest]) {
                    $("."+curRest).text(parseInt($("."+curRest).text())-1);
                    usergoing[curRest] = false;
                } else {
                    $("."+curRest).text(parseInt($("."+curRest).text())+1);
                    usergoing[curRest] = true;
                }
        }
        $.get('/addgoing/'+curRest, function(data) {
            var data = JSON.parse(data);
            if (data.loginFail == true) {
                $("#login").html('<i class="material-icons">warning</i>You need to login to do that!');
            }
        });
       
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
        console.log(usergoing)
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
                  '<a id="goingClick" name="'+data.id+'" class="secondary-content"><span id="going" class="'+data.id+'">'+going+'</span> going!</a></li>'
        $("ul").append(string);
        $("#loader").hide();
    }, 'json')
}