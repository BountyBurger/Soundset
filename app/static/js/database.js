$(document).ready(function () {
    const token = localStorage.getItem("token");
    const database_name = localStorage.getItem("database");

    if (!token || !database_name) {
        window.location.href = "/login";
        return;
    }

    // Load current metadata
    function loadMetadata() {
        $.ajax({
            url: "/api/database/info?session_token=" + token,
            type: "GET",
            success: function (data) {
                $("#db_title").val(data.title);
                $("#db_description").val(data.description);
            },
            error: function (err) {
                console.error("Failed to load metadata", err);
            }
        });
    }

    loadMetadata();

    // Save Information
    $("#save_info_btn").click(function () {
        const title = $("#db_title").val();
        const description = $("#db_description").val();

        $.ajax({
            url: "/api/database/info",
            type: "POST",
            data: JSON.stringify({
                session_token: token,
                title: title,
                description: description
            }),
            contentType: "application/json",
            success: function () {
                showToast("Success", "Database information updated successfully.");
            },
            error: function (err) {
                showToast("Error", "Failed to update information.");
                console.error(err);
            }
        });
    });

    // Export Database
    $("#export_db_btn").click(function () {
        const url = "/api/database/export?session_token=" + token;
        
        // Use fetch for download
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", database_name + "_backup.json");
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            })
            .catch(err => {
                showToast("Error", "Failed to export database.");
                console.error(err);
            });
    });

    // Import Database - Show Warning
    $("#import_db_btn").click(function () {
        const file = $("#import_file")[0].files[0];
        if (!file) {
            showToast("Warning", "Please select a JSON file to import.");
            return;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('confirm_import_modal'));
        modal.show();
    });

    // Import Database - Final Action
    $("#confirm_import_btn").click(function () {
        const file = $("#import_file")[0].files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const importData = JSON.parse(e.target.result);
                
                // POST to API
                $.ajax({
                    url: "/api/database/import",
                    type: "POST",
                    data: JSON.stringify({
                        session_token: token,
                        data: importData
                    }),
                    contentType: "application/json",
                    success: function () {
                        bootstrap.Modal.getInstance(document.getElementById('confirm_import_modal')).hide();
                        showToast("Import Successful", "Database has been overwritten. Refreshing...");
                        setTimeout(() => window.location.reload(), 2000);
                    },
                    error: function (err) {
                        showToast("Import Failed", err.responseText || "An error occurred during import.");
                        console.error(err);
                    }
                });
            } catch (err) {
                showToast("Error", "Invalid JSON file.");
            }
        };

        reader.readAsText(file);
    });

    function showToast(title, body) {
        $("#toast_title").text(title);
        $("#toast_body").text(body);
        const toast = new bootstrap.Toast(document.getElementById('status_toast'));
        toast.show();
    }
});
