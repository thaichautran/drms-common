interface OGMapModel {
    boundary?: string,
    center?: string,
    cluster?: boolean
    defaultzoom?: number,
    description?: string,
    icon?: string,
    id: number,
    mapBaseLayers?: OGMapBaseLayerModel[],
    mapLayers?: OGMapLayerModel[],
    mapRegions?: OGMapRegion[],
    mapTables?: OGMapTableModel[],
    maxzoom?: number,
    minzoom?: number,
    name?: string,
    parent_id?: number,
    permanent?: boolean,
    slug?: string,
}
interface OGMapLayerModel {
    layer_id?: number,
    map_id?: number,
    visible?: boolean
}

interface OGMapTableModel {
    map_id?: number,
    table_id?: number,
    visible?: boolean
}

interface OGMapBaseLayerModel {
    base_layer_id?: number,
    map_id?: number,
    visible?: boolean
}

interface OGMapRegion {
    area_code?: string;
    /** Loại hành chính, 1 là tỉnh, 2 là huyện, 3 là xã */
    area_type?: 1 | 2 | 3;
    map_id?: number;
}


export { OGMapBaseLayerModel, OGMapLayerModel, OGMapModel, OGMapTableModel };