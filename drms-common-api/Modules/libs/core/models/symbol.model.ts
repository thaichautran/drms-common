interface OGSymbol {
    color: number[] | string,
    dasharray: number[]
    height: number,
    imageData: string,
    kind: string,
    opacity: number,
    outline: OGStyleOutline,
    outlineColor: number[] | string,
    outlineWidth: number
    rotate: number
    size: number
    type: string,
    width: number,
}

interface OGStyleOutline {
    color : number[] | string
    height: number,
    width: number,
}


export { OGSymbol };