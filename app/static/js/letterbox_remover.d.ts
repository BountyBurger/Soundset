/**
 * Définitions TypeScript pour le module de détection et suppression du letterboxing.
 */

export interface LetterboxCropOptions {
    /** Tolérance de couleur noire (0 à 255) pour absorber le bruit de compression JPEG. Par défaut: 20. */
    tolerance?: number;
    /** Format de retour souhaité : 'blob', 'dataURL' ou 'object'. Par défaut: 'blob'. */
    format?: 'blob' | 'dataURL' | 'object';
    /** Type MIME pour l'encodage ('image/jpeg', 'image/png', 'image/webp'). Par défaut: 'image/jpeg'. */
    mimeType?: 'image/jpeg' | 'image/png' | 'image/webp' | string;
    /** Qualité d'encodage JPEG/WebP de 0 à 1. Par défaut: 0.92. */
    quality?: number;
    /** Ratio maximal de pixels non-noirs tolérés par ligne (ex: 0.01 pour 1%). Par défaut: 0.0. */
    maxNonBlackRatio?: number;
    /** Hauteur minimale en pixels pour qualifier une bande noire. Par défaut: 1. */
    minBarHeight?: number;
    /** Si true, configure img.crossOrigin = 'anonymous'. Par défaut: true. */
    crossOrigin?: boolean;
}

export interface LetterboxCropResultObject {
    /** Indique si un rognage a été effectué */
    cropped: boolean;
    /** Données résultantes (Blob, DataURL ou URL originale) */
    data: Blob | string;
    /** Coordonnée top déterminée */
    top: number;
    /** Coordonnée bottom déterminée */
    bottom: number;
    /** Dimensions originales */
    originalWidth: number;
    originalHeight: number;
    /** Nouvelles dimensions rognées */
    croppedWidth: number;
    croppedHeight: number;
}

/**
 * Détecte et rogne automatiquement les bandes noires haut et bas d'une image issue d'une URL externe.
 */
export function removeLetterboxing(
    source: string | HTMLImageElement,
    options?: LetterboxCropOptions & { format?: 'blob' }
): Promise<Blob | string>;

export function removeLetterboxing(
    source: string | HTMLImageElement,
    options: LetterboxCropOptions & { format: 'dataURL' }
): Promise<string>;

export function removeLetterboxing(
    source: string | HTMLImageElement,
    options: LetterboxCropOptions & { format: 'object' }
): Promise<LetterboxCropResultObject>;

export const removeImageBlackBars: typeof removeLetterboxing;

export interface LetterboxCanvasContext {
    canvas: OffscreenCanvas | HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    isOffscreen: boolean;
}

export const LetterboxRemover: {
    crop: typeof removeLetterboxing;
    isRowBlack: (data: Uint8ClampedArray, y: number, width: number, tolerance: number, maxNonBlackRatio?: number) => boolean;
    createCanvas: (width: number, height: number) => LetterboxCanvasContext;
    destroyCanvas: (canvasObj: LetterboxCanvasContext | null) => void;
    loadImage: (source: string | HTMLImageElement, crossOrigin?: boolean) => Promise<HTMLImageElement>;
};

declare global {
    interface Window {
        removeLetterboxing: typeof removeLetterboxing;
        removeImageBlackBars: typeof removeLetterboxing;
        LetterboxRemover: typeof LetterboxRemover;
    }
}
