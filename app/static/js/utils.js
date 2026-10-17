/* ---------- UTILS ----------*/
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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
                var thumbUrl = item[13];
                $("#edit_set_thumbnail").attr("src", thumbUrl);
                $("#edit_set_thumbnail_bg").css("background-image", "url(" + thumbUrl + ")");
                $("#edit_set_thumbnail_bg").css("background-size", "cover");
                $("#edit_set_thumbnail_bg").css("background-position", "center");
                $("#edit_set_thumbnail").show();
                $("#edit_set_thumbnail_div").show();

                // Suppression automatique des bandes noires (letterboxing haut et bas)
                removeLetterboxing(thumbUrl, { format: 'dataURL' })
                    .then(function (cleanUrl) {
                        if (current_edit_id === id && cleanUrl) {
                            $("#edit_set_thumbnail_bg").css("background-image", "url(" + cleanUrl + ")");
                            $("#edit_set_thumbnail").attr("src", cleanUrl);
                        }
                    })
                    .catch(function (err) {
                        console.warn("[open_edit_modal] Erreur lors de la suppression des bandes noires :", err);
                    });
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
                    border-dark position-relative">'+ escapeHtml(get_artist_name_from_id(artist_list[i])) + '<span \
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
                    tags_div += "<span style='background: linear-gradient(315deg," + badge_color + " 25%,rgb(255, 255, 255) 50%," + badge_color + " 75%);animation: gradientMove " + sec_random + "s ease-in-out infinite;background-size: 200% 200%;' class='me-2 badge rounded-pill shadow-sm text-dark edit_tag_item'>" + escapeHtml(get_tag_name_from_id(tag_list[i])) + "</span>";
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

/* ==========================================================================
   MODULE DE DÉTECTION ET SUPPRESSION DES BANDES NOIRES (LETTERBOXING)
   ========================================================================== */

/**
 * Options de configuration pour la détection et la suppression des bandes noires.
 * @typedef {Object} LetterboxCropOptions
 * @property {number} [tolerance=20] - Tolérance de couleur (0-255) pour compenser les artefacts de compression JPEG sur le noir.
 * @property {'blob'|'dataURL'|'object'} [format='blob'] - Format de sortie désiré ('blob', 'dataURL' ou 'object' avec métadonnées).
 * @property {string} [mimeType='image/jpeg'] - Type MIME de sortie pour l'encodage ('image/jpeg', 'image/png', 'image/webp').
 * @property {number} [quality=0.92] - Qualité d'encodage (0 à 1) pour JPEG/WebP.
 * @property {number} [maxNonBlackRatio=0.0] - Ratio toléré de pixels non-noirs par ligne pour résister au bruit (ex: 0.01 = 1%).
 * @property {number} [minBarHeight=1] - Épaisseur minimale (en px) pour considérer une zone comme bande noire.
 * @property {boolean} [crossOrigin=true] - Si true, active l'attribut crossOrigin='anonymous' pour charger les images externes.
 */

/**
 * Charge une image de façon asynchrone depuis une URL ou un élément HTMLImageElement.
 * @param {string|HTMLImageElement} source - URL externe ou élément image.
 * @param {boolean} [crossOrigin=true] - Utiliser crossOrigin='anonymous'.
 * @returns {Promise<HTMLImageElement>}
 */
function loadLetterboxImage(source, crossOrigin = true) {
    return new Promise((resolve, reject) => {
        if (!source) {
            return reject(new Error("[LetterboxRemover] Source d'image invalide ou absente."));
        }

        if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
            if (source.complete && source.naturalWidth > 0) {
                return resolve(source);
            }
        }

        const img = new Image();
        if (crossOrigin) {
            img.crossOrigin = 'anonymous';
        }

        img.onload = () => {
            img.onload = null;
            img.onerror = null;
            resolve(img);
        };

        img.onerror = (err) => {
            img.onload = null;
            img.onerror = null;
            reject(new Error(`[LetterboxRemover] Échec du chargement de l'image (vérifiez les en-têtes CORS) : ${typeof source === 'string' ? source : source.src}`));
        };

        img.src = typeof source === 'string' ? source : source.src;
    });
}

/**
 * Crée un canvas en mémoire (OffscreenCanvas si supporté, sinon élément <canvas> HTML).
 * @param {number} width - Largeur du canvas.
 * @param {number} height - Hauteur du canvas.
 * @returns {{ canvas: (OffscreenCanvas|HTMLCanvasElement), ctx: CanvasRenderingContext2D, isOffscreen: boolean }}
 */
function createLetterboxCanvas(width, height) {
    if (typeof OffscreenCanvas !== 'undefined') {
        try {
            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
                return { canvas, ctx, isOffscreen: true };
            }
        } catch (e) {
            // Repli sur le canvas DOM si OffscreenCanvas échoue
        }
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    return { canvas, ctx, isOffscreen: false };
}

/**
 * Libère explicitement les ressources mémoires du canvas créé.
 * @param {{ canvas: (OffscreenCanvas|HTMLCanvasElement|null), ctx: (CanvasRenderingContext2D|null) }} canvasObj
 */
function destroyLetterboxCanvas(canvasObj) {
    if (!canvasObj) return;
    try {
        if (canvasObj.canvas) {
            canvasObj.canvas.width = 0;
            canvasObj.canvas.height = 0;
        }
        canvasObj.ctx = null;
        canvasObj.canvas = null;
    } catch (e) {
        // Ignorer les erreurs potentielles de nettoyage
    }
}

/**
 * Analyse si une ligne horizontale de pixels est considérée comme noire.
 * @param {Uint8ClampedArray} data - Données brutes RGBA issues de getImageData.
 * @param {number} y - Coordonnée de la ligne.
 * @param {number} width - Largeur de l'image.
 * @param {number} tolerance - Seuil RGB max pour être considéré comme noir.
 * @param {number} maxNonBlackRatio - Ratio max de pixels tolérés au-dessus du seuil.
 * @returns {boolean}
 */
function isLetterboxRowBlack(data, y, width, tolerance, maxNonBlackRatio = 0.0) {
    const rowOffset = y * width * 4;
    const maxNonBlackPixels = Math.floor(width * maxNonBlackRatio);
    let nonBlackCount = 0;

    for (let x = 0; x < width; x++) {
        const idx = rowOffset + (x * 4);
        const alpha = data[idx + 3];

        // Un pixel totalement transparent est considéré comme fond neutre / noir
        if (alpha === 0) continue;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        if (r > tolerance || g > tolerance || b > tolerance) {
            nonBlackCount++;
            if (nonBlackCount > maxNonBlackPixels) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Détecte et supprime automatiquement les bandes noires (letterboxing haut et bas) d'une image.
 *
 * @param {string|HTMLImageElement} source - URL externe de l'image ou élément <img>.
 * @param {LetterboxCropOptions} [options={}] - Options de détection et format de sortie.
 * @returns {Promise<Blob|string|Object>} Promesse résolue avec le Blob, la DataURL ou la source originale sans réencodage.
 */
async function removeLetterboxing(source, options = {}) {
    const {
        tolerance = 20,
        format = 'blob',
        mimeType = 'image/jpeg',
        quality = 0.92,
        maxNonBlackRatio = 0.0,
        minBarHeight = 1,
        crossOrigin = true
    } = options;

    // 1. Chargement de l'image
    let img = null;
    try {
        img = await loadLetterboxImage(source, crossOrigin);
    } catch (err) {
        console.warn('[LetterboxRemover] Erreur lors du chargement de l\'image :', err);
        return source;
    }

    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    if (!width || !height) {
        return source;
    }

    // 2. Initialisation du canvas en mémoire avec willReadFrequently: true
    const srcCanvasObj = createLetterboxCanvas(width, height);
    if (!srcCanvasObj.ctx) {
        destroyLetterboxCanvas(srcCanvasObj);
        return source;
    }

    let imgData = null;
    try {
        srcCanvasObj.ctx.drawImage(img, 0, 0, width, height);
        imgData = srcCanvasObj.ctx.getImageData(0, 0, width, height);
    } catch (err) {
        // Ex: Canvas teinté par restriction CORS (SecurityError)
        console.warn('[LetterboxRemover] Échec d\'accès aux pixels (CORS SecurityError). Retour de la source :', err);
        destroyLetterboxCanvas(srcCanvasObj);
        img = null;
        return source;
    }

    const data = imgData.data;

    // 3. Détection des bandes noires : parcours haut vers bas
    let top = 0;
    for (let y = 0; y < height; y++) {
        if (isLetterboxRowBlack(data, y, width, tolerance, maxNonBlackRatio)) {
            top = y + 1;
        } else {
            break;
        }
    }

    // 4. Détection des bandes noires : parcours bas vers haut
    let bottom = height - 1;
    for (let y = height - 1; y >= top; y--) {
        if (isLetterboxRowBlack(data, y, width, tolerance, maxNonBlackRatio)) {
            bottom = y - 1;
        } else {
            break;
        }
    }

    // Application du seuil minBarHeight
    if (top < minBarHeight) {
        top = 0;
    }
    if ((height - 1 - bottom) < minBarHeight) {
        bottom = height - 1;
    }

    const hasBlackBars = (top > 0) || (bottom < height - 1);
    const isEntirelyBlack = (top > bottom);

    // 5. Condition de sortie rapide : aucune bande noire ou image totalement noire
    if (!hasBlackBars || isEntirelyBlack) {
        destroyLetterboxCanvas(srcCanvasObj);
        img = null;

        if (format === 'object') {
            return {
                cropped: false,
                data: source,
                top: 0,
                bottom: height - 1,
                originalWidth: width,
                originalHeight: height,
                croppedWidth: width,
                croppedHeight: height
            };
        }

        // Retourne directement la source d'origine sans aucun réencodage
        return source;
    }

    // 6. Rognage aux nouvelles dimensions
    const croppedHeight = bottom - top + 1;
    const cropCanvasObj = createLetterboxCanvas(width, croppedHeight);

    if (!cropCanvasObj.ctx) {
        destroyLetterboxCanvas(srcCanvasObj);
        destroyLetterboxCanvas(cropCanvasObj);
        img = null;
        return source;
    }

    cropCanvasObj.ctx.drawImage(
        srcCanvasObj.canvas,
        0, top, width, croppedHeight,
        0, 0, width, croppedHeight
    );

    // Libérer immédiatement le canvas source
    destroyLetterboxCanvas(srcCanvasObj);

    // 7. Génération de la sortie (Blob ou DataURL)
    let result = null;

    if (format === 'dataURL') {
        if (cropCanvasObj.isOffscreen && !cropCanvasObj.canvas.toDataURL) {
            // OffscreenCanvas standard converti via Blob
            const blob = await cropCanvasObj.canvas.convertToBlob({ type: mimeType, quality });
            result = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } else {
            result = cropCanvasObj.canvas.toDataURL(mimeType, quality);
        }
    } else {
        // Format Blob par défaut
        if (cropCanvasObj.canvas.convertToBlob) {
            result = await cropCanvasObj.canvas.convertToBlob({ type: mimeType, quality });
        } else if (cropCanvasObj.canvas.toBlob) {
            result = await new Promise((resolve) => {
                cropCanvasObj.canvas.toBlob(resolve, mimeType, quality);
            });
        } else if (cropCanvasObj.canvas.toDataURL) {
            const dataUrl = cropCanvasObj.canvas.toDataURL(mimeType, quality);
            result = await (await fetch(dataUrl)).blob();
        }
    }

    // 8. Nettoyage mémoire du canvas de rognage et des références
    destroyLetterboxCanvas(cropCanvasObj);
    img = null;

    if (format === 'object') {
        return {
            cropped: true,
            data: result,
            top: top,
            bottom: bottom,
            originalWidth: width,
            originalHeight: height,
            croppedWidth: width,
            croppedHeight: croppedHeight
        };
    }

    return result;
}

/**
 * Objet utilitaire d'espace de noms pour l'exportation et les fonctions annexes.
 */
const LetterboxRemover = {
    crop: removeLetterboxing,
    isRowBlack: isLetterboxRowBlack,
    createCanvas: createLetterboxCanvas,
    destroyCanvas: destroyLetterboxCanvas,
    loadImage: loadLetterboxImage
};

// Exportation globale / UMD
if (typeof window !== 'undefined') {
    window.removeLetterboxing = removeLetterboxing;
    window.removeImageBlackBars = removeLetterboxing;
    window.LetterboxRemover = LetterboxRemover;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        removeLetterboxing,
        removeImageBlackBars: removeLetterboxing,
        LetterboxRemover
    };
}