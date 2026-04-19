/*---------- EVENTS ----------*/

//call the search function when the page loads
window.addEventListener("load", (event) => {
    update_tags_list();
    update_artists_list();
    search();
    $("#unrated_checkbox").trigger("change");
});

/* dual slider js */
var lowerSlider = document.querySelector('#lower'),
    upperSlider = document.querySelector('#upper'),
    lowerVal = parseInt(lowerSlider.value);
upperVal = parseInt(upperSlider.value);

upperSlider.oninput = function () {
    lowerVal = parseInt(lowerSlider.value);
    upperVal = parseInt(upperSlider.value);

    if (upperVal < lowerVal + 4) {
        lowerSlider.value = upperVal - 4;

        if (lowerVal == lowerSlider.min) {
            upperSlider.value = 4;
        }
    }
};

lowerSlider.oninput = function () {
    lowerVal = parseInt(lowerSlider.value);
    upperVal = parseInt(upperSlider.value);

    if (lowerVal > upperVal - 4) {
        upperSlider.value = lowerVal + 4;

        if (upperVal == upperSlider.max) {
            lowerSlider.value = parseInt(upperSlider.max) - 4;
        }

    }
};

$("#lower").on("input", function () {
    update_duration_range();
});

$("#upper").on("input", function () {
    update_duration_range();
});


$("#btn_add_artist").on("click", function () {
    var artist_name = $("#artist_input").val();
    $("#artist_list").append("<div id='" + artist_name + "' class='artist-pill m-2 rounded-4 fw-medium px-2 py-1 bg-primary-subtle'>" + artist_name + "</div>");
    $("#artist_input").val("");
});

$("#artist_list").on("click", ".artist-pill", function () {
    $(this).remove();
});

$("#show_filters_btn").on("click", function () {
    $("#show_filters_arrow").toggleClass("fa-chevron-down fa-chevron-up");
    $("#show_filters_arrow").removeClass("fa-bounce");
});

$("#search_btn").on("click", function () {
    $("#loading-popup").fadeIn(200);
    search();
});

$("#unrated_checkbox").on("change", function () {
    if ($(this).is(":checked")) {
        $("#rating_input_container").hide();
    } else {
        $("#rating_input_container").show();
    }
});

$("#edit_artist_talking").on("change", function () {
    if ($(this).is(":checked")) {
        $("#edit_artist_talking_label").text("Yes");
    } else {
        $("#edit_artist_talking_label").text("No");
    }
});

$("#edit_btn_add_artist").on("click", function () {
    if ($("#edit_artist_input").val() != "") {
        var artist_name = $("#edit_artist_input").val();
        var artist_id = get_artist_id_from_name(artist_name);
        if (artist_id == -1) {
            artist_name += " (new)";
        }
        //check if already in 
        for (var i = 0; i < $("#edit_artist_list").children().length; i++) {
            if ($("#edit_artist_list").children().eq(i)[0].innerText == artist_name) {
                $("#edit_artist_input").val("");
                return;
            }
        }

        $("#edit_artist_list").append("<div class='edit_artist_item mx-2 rounded-3 border p-2 border-dark position-relative'>" + artist_name + "<span class='position-absolute top-0 start-100 translate-middle rounded-pill bg-danger'><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-x' viewBox='0 0 16 16'>\
        <path d='M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708'/>\
        </svg></span></div>");
        $(".edit_artist_item").on("click", function () {
            $(this).remove();
        });
        $("#edit_artist_input").val("");
    }
});

$("#edit_btn_add_tag").on("click", function () {
    if ($("#edit_tag_input").val() != "") {
        var tag_name = $("#edit_tag_input").val();
        var tag_id = get_tag_id_from_name(tag_name);
        var badge_color = stringToColor(tag_name);
        if (tag_id == -1) {
            tag_name += " (new)";
        }
        //check if already in
        for (var i = 0; i < $("#edit_tag_list").children().length; i++) {
            if ($("#edit_tag_list").children().eq(i)[0].innerText == tag_name) {
                $("#edit_tag_input").val("");
                return;
            }
        }
        var sec_random = 7;
        var badge_color = stringToColor(tag_name);

        $("#edit_tag_list").append("<span style='background: linear-gradient(315deg," + badge_color + " 25%,rgb(255, 255, 255) 50%," + badge_color + " 75%);animation: gradientMove " + sec_random + "s ease-in-out infinite;background-size: 200% 200%;' class='edit_tag_item me-2 badge rounded-pill shadow-sm text-dark'>" + tag_name + "</span>");
        $(".edit_tag_item").on("click", function () {
            $(this).remove();
        });
        $("#edit_tag_input").val("");
    }
});

$("#save_edit_set").on("click", function () {
    var id = current_edit_id;
    var update_data = {};
    var item = null;

    current_items_data.forEach(function (itemF) {
        if (itemF[0] == id) {
            item = itemF;
        }
    });

    if (item != null) {
        update_data["id"] = item[0];

        if ($("#edit_set_title").val() != item[2]) {
            update_data["title"] = $("#edit_set_title").val();
        }

        var previous_artist_list = [];
        if (item[15] != null) {
            previous_artist_list = item[15].split(",");
        }
        var new_artist_list = [];
        $("#edit_artist_list").children().each(function () {
            //try to find an existing artist id
            var artist_id = get_artist_id_from_name($(this)[0].innerText);
            if (artist_id == -1) {
                //if not found, add a new artist
                artist_id = "##NEW##" + $(this)[0].innerText.slice(0, -6);
            }
            new_artist_list.push(artist_id.toString());
        });
        if (JSON.stringify(new_artist_list) !== JSON.stringify(previous_artist_list)) {
            console.log("artist list changed");
            update_data["artists"] = new_artist_list.join(",");
        }

        var previous_tag_list = [];
        if (item[14] != null) {
            previous_tag_list = item[14].split(",");
        }
        var new_tag_list = [];
        $("#edit_tag_list").children().each(function () {
            //try to find an existing tag id
            var tag_id = get_tag_id_from_name($(this).text());
            if (tag_id == -1) {
                //if not found, add a new tag
                tag_id = "##NEW##" + $(this).text().slice(0, -6);
            }
            new_tag_list.push(tag_id.toString());
        });
        if (JSON.stringify(new_tag_list) !== JSON.stringify(previous_tag_list)) {
            console.log("tag list changed");
            update_data["tags"] = new_tag_list.join(",");
        }

        if ($("#edit_rating_input").val() != item[9]) {
            update_data["rating"] = $("#edit_rating_input").val() || 0;
        }

        var edit_select_record_quality = $("#edit_select_record_quality").val()
        if (edit_select_record_quality == null) {
            edit_select_record_quality = -1;
        }
        if (edit_select_record_quality != item[6]) {
            update_data["record_quality"] = edit_select_record_quality;
        }

        var edit_select_crowd_level = $("#edit_select_crowd_level").val()
        if (edit_select_crowd_level == null) {
            edit_select_crowd_level = -1;
        }
        if (edit_select_crowd_level != item[8]) {
            update_data["crowd_level"] = edit_select_crowd_level;
        }

        if ($("#edit_artist_talking").is(":checked") != item[7]) {
            update_data["artist_talking"] = $("#edit_artist_talking").is(":checked");
        }

        if (Object.keys(update_data).length > 1) {
            var json_to_send = {
                session_token: localStorage.getItem("token"),
                api_data: update_data
            };
            $.ajax("/api/update_set", {
                data: JSON.stringify(json_to_send),
                contentType: 'application/json',
                type: 'POST',
                success: function (data) {
                    console.log("UPDATE STATUS : " + data);
                    update_artists_list();
                    update_tags_list();
                    search();
                },
                error: function () {
                    console.log("error");
                }
            });
        } else {
            console.log("nothing to update");
        }
    } else {
        console.log("error : unknown id");
    }
    //close modal
    $("#edit_set").modal("hide");
});

$("#btn_add_set").on("click", function () {
    $("#add_set").modal("show");
});

$("#add_set_url").keypress(function (e) {
    if (e.which == 13) {
        $("#add_set-btn").click();
    }
});

$("#add_set-btn").on("click", function () {
    var url = $("#add_set_url").val();
    var rating = $("#add_set_rating").val() || -1;
    var record_quality = $("#add_set_record_quality").val();
    var crowd_level = $("#add_set_crowd_level").val();
    var artist_talking = $("#add_set_artist_talking").is(":checked");

    var add_data = {
        "url": url,
        "rating": rating,
        "record_quality": record_quality,
        "crowd_level": crowd_level,
        "artist_talking": artist_talking
    };

    var json_to_send = {
        session_token: localStorage.getItem("token"),
        api_data: add_data
    };

    console.log("ADD JSON : " + JSON.stringify(json_to_send));
    $.ajax("/api/add_set", {
        data: JSON.stringify(json_to_send),
        contentType: 'application/json',
        type: 'POST',
        success: function (data) {
            console.log("ADD STATUS : " + data);
            $("#add_set_url").val("");
            $("#add_set").modal("hide");
            search();
        },
        error: function (data) {
            switch (data.status) {
                case 510:   //Info
                    $("#info_modal_title").text("ℹ️ Info");
                    break;
                case 511:   //error
                    $("#info_modal_title").text("❌ Error");
                    break;
                default:
                    $("#info_modal_title").text("⚠️");
                    break;
            }
            $("#info_modal_text").text(data.responseText);
            $("#add_set").modal("hide");
            $("#info_modal").modal("show");
        }
    });

});

$("#delete_set-btn").on("click", function () {
    var id = current_edit_id;
    var json_to_send = {
        session_token: localStorage.getItem("token"),
        api_data: {
            id: id
        }
    };

    $.ajax("/api/delete_set", {
        data: JSON.stringify(json_to_send),
        contentType: 'application/json',
        type: 'POST',
        success: function (data) {
            console.log("DELETE STATUS : " + data);
            $("#edit_set").modal("hide");
            search();
        },
        error: function () {
            console.log("error");
        }
    });
});

//When enter is pressed in the search bar, click the search button
$("#title_search_input").keypress(function (e) {
    if (e.which == 13) {
        $("#loading-popup").fadeIn(200);
        $("#filters_section").collapse("hide");
        search();
    }
});

$("#navbar-brand").on("click", function () {
    location.reload();
});