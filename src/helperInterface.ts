export interface HTTPResponse {
    analysis: string;
}

export interface MatchedElement {
    selector: string;
    content: string;
}

export type GenericObject = {[key:string]: number};