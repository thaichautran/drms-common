import { Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorImageLayer from "ol/layer/VectorImage";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorSource from "ol/source/Vector";
import { Style } from "ol/style";

import { EnumGeometry } from "../enums/enums";
import { OGTableColumnModel, OGTableModel, OGTableSchemaModel } from "./table.model";

interface OGBaseLayerModel {
    id? : number,
    name?: string,
    type?: string,
    url?: string,
    visible?: boolean

}
interface OGLayerGroupModel {
    icon?: null;
    id: number;
    layers?: OGLayerModel[];
    name_en: string;
    name_vn: string;
    order: number;
    order_id?: number;
    schema_info?: OGTableSchemaModel;
    table_schema?: string;
    tile_layers?: null;
}
interface OGLayerModel {
    classify_column?: OGTableColumnModel;
    classify_column_id?: number;
    data_domains?: { [key: string]: object }[];
    declutter?: boolean;
    domains?: OGLayerDomainModel[];
    geometry?: EnumGeometry;
    hidden?: boolean;
    icon?: null;
    id: number;
    individual_feature?: number;
    is_label_visible?: boolean;
    is_visible?: boolean;
    label_column?: OGTableColumnModel | null;
    label_column_id?: number;
    label_expression?: null | string;
    label_max_zoom?: number;
    label_min_zoom?: number;
    label_styles?: null | string;
    layer?: VectorImageLayer<Feature, VectorSource<Feature>> | VectorLayer<VectorSource<Feature>> | VectorTileLayer;
    layer_classify?: OGLayerClassifyModel[];
    layer_domains?: null;
    layer_files?: null;

    layer_group?: OGLayerGroupModel | null;
    layer_group_id?: number;
    layer_type?: string;
    max_zoom?: number;
    min_zoom?: number;
    name_vn?: string;
    order?: number;
    params?: null | string;
    permanent?: boolean;
    show_line_arrow?: boolean;
    sld_styles?: null;
    styles?: string;
    styles_anchor_x?: number;
    styles_anchor_y?: number;
    symbolStyles?: Style[];
    table?: OGTableModel;
    table_info_id?: number;
    url?: null | string;
}
interface OGLayerClassifyModel {
    description: string;
    id: number;
    layer?: OGLayerModel;
    layer_id: number;
    order: number;
    selected?: boolean;
    style: string;
    table_column_id: number;
    value: string;
}
interface OGLayerDomainModel {
    column_id: number;
    layer: OGLayerModel;
    layer_id: number;
    table_id: number;
    table_info : OGTableModel;
}

interface OGTileLayerModel {
    id: number;
    layer_group_id: number;
    name: string;
    order?: number;
    type: string;
    url: string;
    visible: boolean;
}

export { OGBaseLayerModel, OGLayerClassifyModel, OGLayerDomainModel, OGLayerGroupModel, OGLayerModel, OGTileLayerModel };