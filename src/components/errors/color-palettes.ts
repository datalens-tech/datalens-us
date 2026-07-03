import {definePresentableError} from './define';

export class ColorPaletteNotExistsError extends definePresentableError({
    code: 'COLOR_PALETTE_NOT_EXISTS',
    httpCode: 404,
    message: "The pallete doesn't exist",
}) {}

export class TooManyColorPalettesError extends definePresentableError({
    code: 'TOO_MANY_COLOR_PALETTES',
    httpCode: 500,
    message: 'Too many color palettes',
}) {}
