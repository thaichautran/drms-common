import { Feature } from "ol";
import { Geometry } from "ol/geom";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { XYZ } from "ol/source";
import VectorSource from "ol/source/Vector";

import { OGLayerModel } from "../layer.model";

class OGVectorLayer extends VectorLayer<OGVectorSource> {
   

}


class OGVectorSource extends VectorSource {
    allowIdentify: boolean;
    declutter: boolean;
    layerInfos: OGLayerModel[];
    // layerVisibles: Layer[];
    source: VectorSource<Feature>;
}

class OGTileLayer extends TileLayer<XYZ> {

}
export { OGTileLayer, OGVectorLayer, OGVectorSource };