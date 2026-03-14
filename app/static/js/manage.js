window.addEventListener("load", (event) => {
    update_tags_list();
    update_artists_list();
});


var global_tag_list = [];
function update_tags_list(search_query = "") {
    $.ajax("/api/get_tags", {
        type: 'POST',
        data: JSON.stringify({ session_token: localStorage.getItem("token"), api_data: { search: search_query } }),
        contentType: 'application/json',
        success: function (data) {
            global_tag_list = data;
            $("#tags_datalist").empty();
            $("#tag_list").empty();
            for (var i = 0; i < data.length; i++) {
                $("#tags_datalist").append('<option value="' + data[i][1] + '">');
                var tag_div = "<div class='list-group-item' id='tag_" + data[i][0] + "'>\
                                <div class='d-flex justify-content-between align-items-center'>\
                                    <div class='d-flex'>\
                                        <div class='fw-normal h5 ps-3 m-1'>"+ data[i][1] + "</div>\
                                        <span class='position-absolute top-50 start-10 translate-middle p-2 border border-light rounded-circle' style='background-color: "+ stringToColor(data[i][1]) + "'></span>\
                                    </div>\
                                    <div class='p-1 border-2 border rounded-2 border-danger delete_tag_btn'><i class='fas fa-trash-can fa-xl' style='color: #dc3545;'></i></div>\
                                </div>\
                            </div>";
                $("#tag_list").append(tag_div);
            }
            update_delete_tag_btn_trigger_event();
        },
        error: function () {
            console.log("error while getting tags list");
        }
    });
}

var global_artist_list = [];
function update_artists_list(search_query = "") {
    $.ajax("/api/get_artists", {
        type: 'POST',
        data: JSON.stringify({ session_token: localStorage.getItem("token"), api_data: { search: search_query } }),
        contentType: 'application/json',
        success: function (data) {
            global_artist_list = data;
            $("#artists_datalist").empty();
            $("#artist_list").empty();
            for (var i = 0; i < data.length; i++) {
                $("#artists_datalist").append('<option value="' + data[i][1] + '">');
                var artist_div = "<div class='list-group-item' id='artist_" + data[i][0] + "'>\
                                    <div class='d-flex justify-content-between align-items-center'>\
                                        <div class='fw-normal h5 m-1'>"+ data[i][1] + "</div>\
                                        <div class='p-1 border-2 border rounded-2 border-danger delete_artist_btn'><i class='fas fa-trash-can fa-xl' style='color: #dc3545;'></i></div>\
                                    </div>\
                                </div>";
                $("#artist_list").append(artist_div);
            }
            update_delete_artist_btn_trigger_event();
        },
        error: function () {
            console.log("error while getting artists list");
        }
    });
}

function update_delete_artist_btn_trigger_event() {
    $(".delete_artist_btn").on("click", function () {
        var a_id = get_artist_id_from_name($(this).parent().children().eq(0).text());
        var json_to_send = {
            session_token: localStorage.getItem("token"),
            api_data: {
                id: a_id
            }
        };
        $.ajax("/api/delete_artist", {
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(json_to_send),
            success: function (data) {
                console.log("artist deleted");
                update_artists_list();
            },
            error: function () {
                console.log("error while deleting artist");
            }
        });
    });
}

function update_delete_tag_btn_trigger_event() {
    $(".delete_tag_btn").on("click", function () {
        var t_id = get_tag_id_from_name($(this).parent().children().children().eq(0).text());
        var json_to_send = {
            session_token: localStorage.getItem("token"),
            api_data: {
                id: t_id
            }
        };
        $.ajax("/api/delete_tag", {
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(json_to_send),
            success: function (data) {
                console.log("tag deleted");
                update_tags_list();
            },
            error: function () {
                console.log("error while deleting tag");
            }
        });
    });
}



$("#add_artist_btn").on("click", function () {
    var artist_name = $("#artist_input").val();
    var json_to_send = {
        session_token: localStorage.getItem("token"),
        api_data: {
            name: artist_name
        }
    };

    $.ajax("/api/add_artist", {
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json_to_send),
        success: function (data) {
            $("#artist_input").val("");
            console.log("artist added");
            update_artists_list();
        },
        error: function () {
            console.log("error while adding artist");
        }
    });
});

$("#add_tag_btn").on("click", function () {
    var tag_name = $("#tag_input").val();
    var json_to_send = {
        session_token: localStorage.getItem("token"),
        api_data: {
            name: tag_name
        }
    };
    $.ajax("/api/add_tag", {
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json_to_send),
        success: function (data) {
            $("#tag_input").val("");
            console.log("tag added");
            update_tags_list();
        },
        error: function () {
            console.log("error while adding tag");
        }
    });
});

$("#search_artist_btn").on("click", function () {
    update_artists_list($("#artist_search_input").val());
});

$("#search_tag_btn").on("click", function () {
    update_tags_list($("#tag_search_input").val());
});

$("#artist_search_input").on("input", function () {
    update_artists_list($(this).val());
});

$("#tag_search_input").on("input", function () {
    update_tags_list($(this).val());
});