$(document).ready(function () {
    //remove localstorage 'token' and 'database' on load
    localStorage.removeItem("token");
    localStorage.removeItem("database");

    function validateCreateForm() {
        let name = $("#db_name_create").val();
        let password = $("#db_password_create").val();
        let repeatPassword = $("#db_password_create_repeat").val();
        let isValidName = /^[a-zA-Z0-9]+$/.test(name);
        let isValidPassword = password.length > 0 && !password.includes(" ");
        let isMatchingPasswords = password === repeatPassword;

        $("#artists-tab-pane .btn").toggleClass("disabled", !(isValidName && isValidPassword && isMatchingPasswords));
        $("#artists-tab-pane .btn").toggleClass("confirm", isValidName && isValidPassword && isMatchingPasswords);
    }

    function validateLoadForm() {
        let name = $("#db_name_load").val();
        let password = $("#db_password_load").val();
        let isValidName = /^[a-zA-Z0-9]+$/.test(name);
        let isValidPassword = password.length > 0 && !password.includes(" ");

        $("#tags-tab-pane .btn").toggleClass("disabled", !(isValidName && isValidPassword));
        $("#tags-tab-pane .btn").toggleClass("confirm", isValidName && isValidPassword);
    }

    function handle_login_success(name, token) {
        // add the token to the local storage
        localStorage.setItem("token", token);
        // add the database name to the local storage
        localStorage.setItem("database", name);
        // redirect to the main page
        window.location.href = "../";
    }

    $("#db_name_create, #db_password_create, #db_password_create_repeat").on("input", validateCreateForm);
    $("#db_name_load, #db_password_load").on("input", validateLoadForm);

    $("#load_db_btn").click(function () {
        //change the text of the button with a spinner
        $("#load_db_btn").html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...');
        //disable the button
        $("#load_db_btn").prop("disabled", true);

        let name = $("#db_name_load").val();
        let password = $("#db_password_load").val();

        $.ajax({
            url: "/api/database/load",
            type: "POST",
            data: JSON.stringify({ name: name, password: password }),
            contentType: "application/json",
            success: function (data) {
                handle_login_success(name, data);
            },
            error: function (data) {
                console.log(data);
                setTimeout(function () {
                    //change the text of the button back to 'Load'
                    $("#load_db_btn").html("Load");
                    //enable the button
                    $("#load_db_btn").prop("disabled", false);

                    //show a login fail alert
                    $("#alert").html("Invalid credentials");
                    $("#alert").show();
                }, 2000);
            }
        });

    });

    $("#create_db_btn").click(function () {
        //change the text of the button with a spinner
        $("#load_db_btn").html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...');
        //disable the button
        $("#load_db_btn").prop("disabled", true);

        let name = $("#db_name_create").val();
        let password = $("#db_password_create").val();

        $.ajax({
            url: "/api/database/create",
            type: "POST",
            data: JSON.stringify({ name: name, password: password }),
            contentType: "application/json",
            success: function (data) {
                handle_login_success(name, data);
            },
            error: function (data) {
                console.log(data);
            }
        });
    });
});
