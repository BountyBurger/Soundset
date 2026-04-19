/* ---------- UTILS ----------*/
var timeoutId = 0;
var startX, startY;
var isScrolling = false;

function update_setdiv_events() {
    //on long press
    $(".title-fade").on("touchstart mousedown", function (e) {
        isScrolling = false;

        // Capture the initial position of the click or touch
        var event = e.originalEvent.touches ? e.originalEvent.touches[0] : e;
        startX = event.pageX;
        startY = event.pageY;

        var id = $(this).parent().parent().attr("id");
        timeoutId = setTimeout(open_edit_modal, 400, id);
    }).on("touchmove mousemove", function (e) {
        var event = e.originalEvent.touches ? e.originalEvent.touches[0] : e;
        var moveX = event.pageX;
        var moveY = event.pageY;

        // Threshold to detect a scroll (displacement of 10px or more)
        var moveThreshold = 10;
        if (Math.abs(moveX - startX) > moveThreshold || Math.abs(moveY - startY) > moveThreshold) {
            isScrolling = true; // Detect that the user is scrolling
            clearTimeout(timeoutId); // Cancel the long press
        }
    }).on("touchend mouseup", function (e) {
        if (!isScrolling) {
            e.preventDefault();
            clearTimeout(timeoutId);

            // Capture the final position of the click or touch
            var event = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0] : e;
            var endX = event.pageX;
            var endY = event.pageY;

            // Threshold to detect a scroll (displacement of 10px or more)
            var moveThreshold = 10;

            if (Math.abs(endX - startX) < moveThreshold && Math.abs(endY - startY) < moveThreshold) {
                // If no scroll occurred, execute the normal action
                if (!$("#edit_set").hasClass("show")) {
                    var id = $(this).parent().parent().attr("id");
                    var json_to_send = {
                        session_token: localStorage.getItem("token"),
                        api_data: {
                            set_id: id
                        }
                    };
                    // Update the click counter
                    $.ajax("/api/update_click_count", {
                        data: JSON.stringify(json_to_send),
                        contentType: 'application/json',
                        type: 'POST',
                        success: function () {
                            new_play_count = parseInt($("#PC" + id).text().split(" ")[3]) + 1;
                            $("#PC" + id).text("Play count : " + new_play_count);
                        },
                        error: function () {
                            console.log("error");
                        }
                    });

                    // Open the link
                    var url = get_url_from_id(id);
                    window.open(url, "_blank");
                }
            }
        }
    });
}



function open_edit_modal(id) {
    //get the id of the set
    current_edit_id = id;
    //get the full title of the set from the current_items_data
    current_items_data.forEach(function (item) {
        if (item[0] == id) {
            var full_title = item[2];
            $("#edit_set_title").val(full_title);

            if (item[13] != null && item[13] != "") {
                $("#edit_set_thumbnail").attr("src", item[13]);
                $("#edit_set_thumbnail_bg").css("background-image", "url(" + item[13] + ")");
                $("#edit_set_thumbnail_bg").css("background-size", "cover");
                $("#edit_set_thumbnail_bg").css("background-position", "center");
                $("#edit_set_thumbnail").show();
                $("#edit_set_thumbnail_div").show();
            } else {
                $("#edit_set_thumbnail").hide();
                $("#edit_set_thumbnail").attr("src", "");
                $("#edit_set_thumbnail_bg").css("background-image", "none");
                $("#edit_set_thumbnail_div").hide();
            }

            $("#edit_artist_list").empty();
            if (item[15] != null) {
                var artist_list = item[15].split(",");
                var artist_div = "";
                for (var i = 0; i < artist_list.length; i++) {
                    artist_div += '<div class="edit_artist_item mx-2 rounded-3 border p-2 \
                    border-dark position-relative">'+ get_artist_name_from_id(artist_list[i]) + '<span \
                    class="position-absolute top-0 start-100 translate-middle rounded-pill bg-danger">\
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" \
                    fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">\
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 \
                    .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 \
                    0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>\
                    </svg></span></div>';
                }
                $("#edit_artist_list").append(artist_div);
                $(".edit_artist_item").on("click", function () {
                    $(this).remove();
                });
            }

            $("#edit_tag_list").empty();
            if (item[14] != null) {
                var tag_list = item[14].split(",");
                var tags_div = "";
                for (var i = 0; i < tag_list.length; i++) {
                    var badge_color = stringToColor(get_tag_name_from_id(tag_list[i]));
                    var sec_random = 7;
                    tags_div += "<span style='background: linear-gradient(315deg," + badge_color + " 25%,rgb(255, 255, 255) 50%," + badge_color + " 75%);animation: gradientMove " + sec_random + "s ease-in-out infinite;background-size: 200% 200%;' class='me-2 badge rounded-pill shadow-sm text-dark edit_tag_item'>" + get_tag_name_from_id(tag_list[i]) + "</span>";
                }
                $("#edit_tag_list").append(tags_div);
                $(".edit_tag_item").on("click", function () {
                    $(this).remove();
                });
            }

            var rating_div = '<input id="edit_rating_input" name="rating_input" class="rating rating-loading" value="' + item[9] + '" data-show-clear="false" data-show-caption="false"></input>';
            $("#edit_rating_div").empty();
            $("#edit_rating_div").append(rating_div);
            $("#edit_rating_input").rating();

            $("#edit_select_record_quality").val(item[6]);

            $("#edit_select_crowd_level").val(item[8]);

            if (item[7] == 0) {
                $("#edit_artist_talking").prop("checked", false);
                $("#edit_artist_talking_label").text("No");
            }
            else if (item[7] == 1) {
                $("#edit_artist_talking").prop("checked", true);
                $("#edit_artist_talking_label").text("Yes");
            }
            else {
                $("#edit_artist_talking").prop("checked", false);
                $("#edit_artist_talking_label").text("?");
            }

            return;
        }
    });
    $("#edit_set").modal("show");
}

function update_duration_range() {
    var lower = $("#lower").val();
    var upper = $("#upper").val();
    var delimiter = " - ";

    if (lower == 0 && upper == 240) {
        $("#duration_label").text("Any");
    } else if (lower == 0) {
        $("#duration_label").text("< " + format_minutes(upper));
    } else if (upper == 240) {
        $("#duration_label").text("> " + format_minutes(lower));
    } else {
        $("#duration_label").text(format_minutes(lower) + delimiter + format_minutes(upper));
    }
}

function format_minutes(minutes) {
    var hours = Math.floor(minutes / 60);
    var mins = minutes % 60;

    if (hours == 0 && mins == 0) {
        return "";
    } else if (hours == 0) {
        return mins + "m";
    } else if (mins == 0) {
        return hours + "h";
    } else {
        return hours + "h " + mins + "m";
    }
}

function stringToColor(str) {
    // Initialize a hash
    let hash = 0;

    // Calculate a hash of the string
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert the hash to a color
    let color = '#';

    for (let i = 0; i < 3; i++) {
        // Extract the 3 relevant bits from the hash
        let value = (hash >> (i * 8)) & 0xFF;

        // Limit the color range to a defined interval
        let min = 75;  // 0x33
        let max = 225; // 0xcc

        // Adjust the value to stay within the range
        value = Math.max(min, Math.min(max, value));

        // Convert to hexadecimal and add to the color
        color += ('00' + value.toString(16)).substr(-2);
    }

    // Add opacity
    color += "B0";

    return color;
}

function get_artist_name_from_id(id) {
    for (var i = 0; i < global_artist_list.length; i++) {
        if (global_artist_list[i][0] == id) {
            return global_artist_list[i][1];
        }
    }
    return "Unknown";
}

function get_tag_name_from_id(id) {
    for (var i = 0; i < global_tag_list.length; i++) {
        if (global_tag_list[i][0] == id) {
            return global_tag_list[i][1];
        }
    }
    return "Unknown";
}

function get_artist_id_from_name(name) {
    for (var i = 0; i < global_artist_list.length; i++) {
        if (global_artist_list[i][1] == name) {
            return global_artist_list[i][0];
        }
    }
    return -1;
}

function get_tag_id_from_name(name) {
    for (var i = 0; i < global_tag_list.length; i++) {
        if (global_tag_list[i][1] == name) {
            return global_tag_list[i][0];
        }
    }
    return -1;
}

function get_url_from_id(id) {
    for (var i = 0; i < current_items_data.length; i++) {
        if (current_items_data[i][0] == id) {
            return current_items_data[i][1];
        }
    }
    return "";
}

function get_play_count_from_id(id) {
    for (var i = 0; i < current_items_data.length; i++) {
        if (current_items_data[i][0] == id) {
            return current_items_data[i][4];
        }
    }
    return 0;
}

function get_index_of_item_from_id(id) {
    for (var i = 0; i < current_items_data.length; i++) {
        if (current_items_data[i][0] == id) {
            return i;
        }
    }
    return -1;
}