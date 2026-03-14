function format_json_data_to_send() {
    // check if token and database name are present in local storage
    if (localStorage.getItem("token") === null || localStorage.getItem("database") === null) {
        window.location.href = "/login";
    }

    //if value is undefined, set it to an empty string
    var title_search = $("#title_search_input").val() || "";

    //get the selected platforms
    var platforms = []
    if ($('.pf:checked').length != $('.pf').length) {
        if ($("#soundcloud_checkbox").is(":checked")) {
            platforms.push("soundcloud");
        }
        if ($("#youtube_checkbox").is(":checked")) {
            platforms.push("youtube");
        }
        if ($("#other_checkbox").is(":checked")) {
            platforms.push("other");
        }
    }

    //lenght range
    var length_min = $("#lower").val();
    var length_max = $("#upper").val();

    //record quality
    var record_quality = 0;
    if ($("#good_record_quality_checkbox").is(":checked")) {
        record_quality += 4;
    }
    if ($("#ok_record_quality_checkbox").is(":checked")) {
        record_quality += 2;
    }
    if ($("#bad_record_quality_checkbox").is(":checked")) {
        record_quality += 1;
    }

    //crowd_level noise
    var crowd_level = 0;
    if ($("#no_crowd_level_checkbox").is(":checked")) {
        crowd_level += 1;
    }
    if ($("#light_crowd_level_checkbox").is(":checked")) {
        crowd_level += 2;
    }
    if ($("#loud_crowd_level_checkbox").is(":checked")) {
        crowd_level += 4;
    }

    //artist talking
    var artist_talking = 0;
    if ($("#artist_not_talking_checkbox").is(":checked")) {
        artist_talking += 1;
    }
    if ($("#artist_talking_checkbox").is(":checked")) {
        artist_talking += 2;
    }

    var rating_min = -1;
    //rating
    if (!$("#unrated_checkbox").is(":checked")) {
        rating_min = $("#rating_input").val() || 0;
    }

    //artist list
    var artists = [];
    $("#artist_list").children().each(function () {
        artists.push(get_artist_id_from_name($(this).text()));
    });

    //tags list
    var tags = [];
    //get all checked tags in #tags_list
    $("#tags_list").children().each(function () {
        if ($(this).is(":checked")) {
            tags.push(parseInt($(this).attr("id")));
        }
    });

    //order by
    if ($("#order_by_rating").is(":checked")) {
        var order_by = "rating";
    } else if ($("#order_by_date").is(":checked")) {
        var order_by = "date";
    } else if ($("#order_by_play_count").is(":checked")) {
        var order_by = "play_count";
    } else {
        var order_by = "random";
    }

    var json_data = {
        "title_search": title_search,
        "platforms": platforms,
        "length_min": length_min,
        "length_max": length_max,
        "record_quality": record_quality,
        "artist_talking": artist_talking,
        "crowd_level": crowd_level,
        "rating_min": rating_min,
        "tags": tags,
        "artists": artists,
        "order_by": order_by
    };

    var json_final = {
        "session_token": localStorage.getItem("token"),
        "data_request": json_data
    };

    console.log("SEARCH JSON")
    console.log(json_final);
    return json_final;
}

var current_items_data = [];
var current_edit_id = 0;

function search() {
    if ($("#show_filters_arrow").hasClass("fa-chevron-up")) {
        $("#show_filters_arrow").toggleClass("fa-chevron-down fa-chevron-up");
    }
    var search_json = format_json_data_to_send();
    $.ajax("/api/search", {
        data: JSON.stringify(search_json),
        contentType: 'application/json',
        type: 'POST',
        success: function (data) {
            current_items_data = data;
            $("#loading-popup").fadeOut(200);
            console.log("SEARCH RESULTS : ");
            console.log(data);

            $("#main_table").empty();

            if (data.length == 0) {
                var filters = search_json.data_request;
                var is_default = (filters.title_search === "" &&
                    filters.platforms.length === 0 &&
                    filters.length_min == 0 &&
                    filters.length_max == 240 &&
                    filters.record_quality == 7 &&
                    filters.artist_talking == 3 &&
                    filters.crowd_level == 7 &&
                    filters.rating_min == 0 &&
                    filters.tags.length === 0 &&
                    filters.artists.length === 0);

                var message = is_default ? "Your library is empty" : "No results found";
                $("#main_table").append("<div class='pt-5 display-5 text-dark text-center'>" + message + "</div>");
                $("#main_table").show();
                return;
            }
            for (var i = 0; i < data.length; i++) {

                var croped_title = data[i][2];
                var div_metadata = "full_title='" + data[i][2] + "'";

                //tags
                var tags_div = "<div class='d-flex justify-content-start'>";
                if (data[i][14] != null) {
                    var tag_array = data[i][14].split(",");
                    for (var j = 0; j < tag_array.length; j++) {
                        //The tags is an ID so we have to get the name of the global_tag_list variable
                        for (var k = 0; k < global_tag_list.length; k++) {
                            if (global_tag_list[k][0] == tag_array[j]) {
                                var badge_color = stringToColor(global_tag_list[k][1]);
                                sec_random = 7;
                                tags_div += "<span style='background: linear-gradient(315deg," + badge_color + " 25%,rgb(255, 255, 255) 50%," + badge_color + " 75%);animation: gradientMove " + sec_random + "s ease-in-out infinite;background-size: 200% 200%;' class='me-2 badge rounded-pill shadow-sm text-dark'>" + global_tag_list[k][1] + "</span>";
                            }
                        }
                    }
                }
                tags_div += "</div>";

                //artists
                var artist_div = "<div class='mb-2 fw-medium'>";
                if (data[i][15] == null) {
                    artist_div = artist_div + "Unknown artist";
                } else {
                    var artist_array = data[i][15].split(",");
                    if (artist_array.length > 1) {
                        var artist_label = "Artists";
                    } else {
                        var artist_label = "Artist";
                    }
                    artist_div = artist_div + artist_label + " : ";
                    for (var j = 0; j < artist_array.length; j++) {
                        //The artist is an ID so we have to get the name of the global_artist_list variable
                        for (var k = 0; k < global_artist_list.length; k++) {
                            if (global_artist_list[k][0] == artist_array[j]) {
                                if (j != 0) {
                                    artist_div += " / ";
                                }
                                artist_div += global_artist_list[k][1];
                            }
                        }
                    }
                }
                artist_div += "</div>";


                // badge for record quality
                if (data[i][6] == 0) {
                    var span_record_quality = "<span class='badge text-bg-danger'>Bad</span>";
                }
                else if (data[i][6] == 1) {
                    var span_record_quality = "<span class='badge text-bg-primary'>OK</span>";
                }
                else if (data[i][6] == 2) {
                    var span_record_quality = "<span class='badge text-bg-success'>Good</span>";
                }
                else {
                    var span_record_quality = "<span class='badge text-bg-secondary'>Unknown</span>";
                }


                // badge for crowd_level noise
                if (data[i][8] == 2) {
                    var span_crowd_level = "<span class='badge text-bg-danger'>Loud</span>";
                }
                else if (data[i][8] == 1) {
                    var span_crowd_level = "<span class='badge text-bg-primary'>Light</span>";
                }
                else if (data[i][8] == 0) {
                    var span_crowd_level = "<span class='badge text-bg-success'>None</span>";
                }
                else {
                    var span_crowd_level = "<span class='badge text-bg-secondary'>Unknown</span>";
                }


                // badge for Artist_talking
                if (data[i][7] == 0) {
                    var span_artist_talking = "<span class='badge text-bg-dark'>No</span>";
                }
                else if (data[i][7] == 1) {
                    var span_artist_talking = "<span class='badge text-bg-dark'>Yes</span>";
                }
                else {
                    var span_artist_talking = "<span class='badge text-bg-secondary'>Unknown</span>";
                }

                var quality_div = "<div class='d-flex w-100 justify-content-between'>\
                                        <div class='p-1 text-center fw-medium rounded-4 border border-dark'>Record quality "+ span_record_quality + "</div>\
                                        <div class='p-1 text-center fw-medium rounded-4 mx-2 border border-dark'>Crowd level "+ span_crowd_level + "</div>\
                                        <div class='p-1 text-center fw-medium rounded-4 border border-dark'>Artist talking "+ span_artist_talking + "</div>\
                                    </div>";

                // rating
                if (data[i][9] <= 5 && data[i][9] > 0) {
                    var rating_div = '<div><input class="rating rating-loading" value="' + data[i][9] + '" data-min="0" data-max="5" data-step="1" data-size="xs" data-show-clear="false" data-show-caption="false" data-readonly="true"></input></div>'
                } else {
                    var rating_div = '<small class="text-secondary">Not Rated</small>';
                }

                //platform
                if (data[i][3] == "soundcloud") {
                    var platform = "<i style='color: #ff5500' class='fa-brands fa-soundcloud'></i>";
                }
                else if (data[i][3] == "youtube") {
                    var platform = "<i style='color: #ff0000' class='fa-brands fa-youtube'></i>";
                }
                else {
                    var platform = "<i class='fas fa-globe'></i>";
                }

                var duration = data[i][5];

                var id = data[i][0];

                var item_div = "\
                <set id='"+ id + "' class='set_div rounded-4 mb-3 list-group-item shadow' " + div_metadata + ">\
                    <div class='d-flex w-100 justify-content-between'>\
                        <div class='title-fade h6 icon-link fw-bold'>"+ platform + croped_title + "</div>\
                        <small>" + duration + "</small>\
                    </div>\
                    "+ artist_div + "\
                    <div class='d-flex w-100 justify-content-between'>\
                        " + tags_div + rating_div + "\
                    </div>\
                    <div class='pt-2 accordion accordion-flush'>\
                        <div class='accordion-item'>\
                            <h2 class='accordion-header'>\
                                <button class='p-1 accordion-button collapsed' type='button' data-bs-toggle='collapse' data-bs-target='#ACC"+ id + "'>\
                                    Quality\
                                </button>\
                            </h2>\
                            <div id='ACC"+ id + "' class='accordion-collapse collapse'>\
                                <div class='accordion-body p-1'>"+ quality_div + "</div>\
                                <div class='mt-2 accordion accordion-flush'>\
                                    <div class='accordion-item'>\
                                        <h2 class='accordion-header'>\
                                            <button class='p-1 accordion-button collapsed' type='button' data-bs-toggle='collapse' data-bs-target='#ACC2"+ id + "'>\
                                                Infos\
                                            </button>\
                                        </h2>\
                                        <div id='ACC2"+ id + "' class='accordion-collapse collapse'>\
                                            <div class='accordion-body p-1'>\
                                                <div class='d-flex flex-column'>\
                                                    <div class='fw-medium'>Release date : "+ data[i][11] + "</div>\
                                                    <div class='fw-medium'>Added in Soundset : "+ data[i][10] + "</div>\
                                                    <div id='PC"+ id + "' class='fw-medium'>Play count : " + data[i][4] + "</div>\
                                                </div>\
                                            </div>\
                                        </div>\
                                    </div>\
                                </div>\
                            </div>\
                        </div>\
                    </div>\
                </set>";
                $("#main_table").append(item_div);
                $(".rating").rating();
            }

            $("#main_table").show();
            update_setdiv_events();
        },
        error: function () {
            console.log("error");
        }
    });
}

var global_tag_list = [];
function update_tags_list() {
    $.ajax("/api/get_tags", {
        type: 'POST',
        data: JSON.stringify({ session_token: localStorage.getItem("token") }),
        contentType: 'application/json',
        success: function (data) {
            global_tag_list = data;
            $("#tags_list").empty();
            $("#tags_datalist").empty();
            for (var i = 0; i < data.length; i++) {
                var badge_color = stringToColor(get_tag_name_from_id(data[i][0]));
                var tag = '<input id="' + data[i][0] + '" type="checkbox" class="btn-check">\
                            <label style="background: \
                                        linear-gradient(315deg,'+ badge_color + ' 25%,rgb(255, 255, 255) 50%,' + badge_color + ' 75%);\
                                        animation: gradientMove 7s ease-in-out infinite;\
                                        border: solid 2px rgba(255, 255, 255, 0); \
                                        background-size: 200% 200%;" \
                                    class="m-2 badge rounded-pill shadow-sm text-dark" \
                                    for="'+ data[i][0] + '">' + data[i][1] + '\
                            </label>';
                $("#tags_list").append(tag);

                $("#" + data[i][0]).change(function () {
                    var label = $("label[for='" + $(this).attr("id") + "']");
                    if ($(this).is(":checked")) {
                        label.css("border", "solid 2px #000");
                    } else {
                        label.css("border", "solid 2px rgba(255, 255, 255, 0)");
                    }
                });
                $("#tags_datalist").append('<option value="' + data[i][1] + '">');
            }
        },
        error: function (err) {
            check_if_bad_token(err.responseText);
            console.log("error while getting tags list");
        }
    });
}


var global_artist_list = [];
function update_artists_list() {
    $.ajax("/api/get_artists", {
        type: 'POST',
        data: JSON.stringify({ session_token: localStorage.getItem("token") }),
        contentType: 'application/json',
        success: function (data) {
            global_artist_list = data;
            $("#artists_datalist").empty();
            for (var i = 0; i < data.length; i++) {
                $("#artists_datalist").append('<option value="' + data[i][1] + '">');
            }
        },
        error: function (err) {
            check_if_bad_token(err.responseText);
            console.log("error while getting artists list");
        }
    });
}

function check_if_bad_token(response) {
    if (response == "Bad session token") {
        localStorage.removeItem("token");
        localStorage.removeItem("database");
        window.location.href = "/login";
    }
}