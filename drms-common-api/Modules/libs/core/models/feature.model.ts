import { RestBase } from "./base-response.model";
import { OGTableRelationModel } from "./table.model";

interface FeatureFile {
    extension?: string,
    feature_id?: string,
    file?: File,
    file_name?: string,
    id?: number,
    image_name?: string,
    layer_id?: number,
    mime_type?: string,
    path?: string,
    raw?: File,
    size?: number,
    store_file?: File,
    table_id? : number,
    uid?: string,
    url?: ArrayBuffer | string,
}

type FeatureAttributes = { [key: string]: Date | number | string };


interface FeatureResponse extends RestBase {
    attributes: FeatureAttributes;
    domain_values: { [key: string]: Date | number | string };
    files: FeatureFile[];
    relations: OGTableRelationModel[]
}

export { FeatureAttributes, FeatureFile, FeatureResponse };