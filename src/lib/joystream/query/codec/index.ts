/* tslint:disable:max-classes-per-file */

import { JSON } from ".."

export class Codec {
    public JSON: JSON

    constructor(src: JSON) {
        this.JSON = src
    }
}

export class Struct extends Codec {
}
