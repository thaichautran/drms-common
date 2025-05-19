import BaseLayer from "ol/layer/Base";

import { OGBaseLayerModel, OGLayerClassifyModel, OGLayerGroupModel, OGLayerModel, OGTileLayerModel } from "./layer.model";

interface TreeItem<T> {
    disabled?: boolean | undefined;
    expanded?: boolean | undefined;
    icon?: string;
    id: number | string;
    raw: T;
    selected?: boolean | undefined;
    text: string;
    type: string;
}
interface BaseLayerGroupTreeItem extends TreeItem<OGBaseLayerModel> {
    items: BaseLayerTreeItem[];
}

interface BaseLayerTreeItem extends TreeItem<OGBaseLayerModel> {
}

interface LayerGroupTreeItem extends TreeItem<OGLayerGroupModel> {
    items: LayerTreeItem[];
}


interface LayerTreeItem extends TreeItem<OGLayerModel | OGTileLayerModel> {
    items: LayerClassifyTreeItem[];
    layerClassify?: OGLayerClassifyModel[];
    layerInfo?: OGLayerModel | OGTileLayerModel;
    layerInstance?: BaseLayer;
}

interface LayerClassifyTreeItem extends TreeItem<OGLayerClassifyModel> {

}

export { BaseLayerGroupTreeItem, BaseLayerTreeItem, LayerClassifyTreeItem, LayerGroupTreeItem, LayerTreeItem, TreeItem };