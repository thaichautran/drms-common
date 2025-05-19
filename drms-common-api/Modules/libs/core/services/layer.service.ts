import axios, { AxiosError, AxiosResponse } from "axios";

import { EnumStatus } from "../enums/enums";
import { RestData, RestError } from "../models/base-response.model";
import { FeatureFile } from "../models/feature.model";
import { OGLayerModel } from "../models/layer.model";
import { OGTableColumnModel, OGTableRelationModel } from "../models/table.model";
import { LayerGroupTreeItem } from "../models/tree-item.model";
class LayerService {
    static data(param): Promise<RestData<object>> {
        return axios({
            data: param,
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: "/api/layer/data",
        }).then(async (xhr: AxiosResponse<RestData<object>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
        }).catch(error => {
            throw error;
        });
    }

    static get(layerId: number): Promise<OGLayerModel> {
        return axios.get("/api/layer/" + layerId).then((xhr: AxiosResponse<RestData<OGLayerModel>>) => {
            if (xhr.status === 200) {
                return xhr.data.data;
            }
            return undefined;
        }).catch((error: AxiosError) => {
            throw error;
        });
    }
    static getFields(layerId: number, keyword?: string): Promise<OGTableColumnModel[]> {
        return axios.get("/api/layer/get-fields", {
            params: {
                id: layerId,
                keyword: keyword
            },
        }).then((xhr: AxiosResponse<RestData<OGTableColumnModel[]>>) => {
            if (xhr.status === 200) {
                return xhr.data.data;
            }
            return undefined;
        }).catch((error: AxiosError) => {
            throw error;
        });
    }

    static getFiles(id: number): Promise<FeatureFile[]> {
        return axios.get(`/api/layer/${id}/files`, {
        }).then((xhr: AxiosResponse<RestData<FeatureFile[]>>) => {
            if (xhr.status === 200) {
                if (xhr.data.status === EnumStatus.OK && xhr.data.data) {
                    return xhr.data.data;
                }
            }
        }).catch((error: AxiosError) => {
            throw error;
        });
    }

    static getLayers(mapId?: number, keyword?: string): Promise<RestData<OGLayerModel[]>> {
        return axios.get("/api/layer/getLayers", {
            params: { keyword: keyword, mapId: mapId }
        }).then((xhr: AxiosResponse<RestData<OGLayerModel[]>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
            return undefined;
        }).catch((error: AxiosError) => {
            throw error;
        });
    }

    static getRelations(id: number): Promise<OGTableRelationModel[]> {
        return axios.get("/api/layer/relations", {
            params: {
                layer_id: id
            }
        }).then((xhr: AxiosResponse<RestData<OGTableRelationModel[]>>) => {
            if (xhr.status === 200) {
                if (xhr.data.status === EnumStatus.OK && xhr.data.data) {
                    return xhr.data.data;
                }
            }
        }).catch((error: AxiosError) => {
            throw error;
        });
    }

    static getTree(tableSchema?: string | undefined): Promise<LayerGroupTreeItem[]> {
        return axios.get("/api/layer/getLayersAndGroupLayers", {
            method: "GET",
            params: {
                tableSchema: tableSchema,
            }
        }).then(async (xhr: AxiosResponse<RestData<LayerGroupTreeItem[]>>) => {
            if (xhr.status === 200) {
                if (xhr.data.status === EnumStatus.OK && xhr.data.data) {
                    return xhr.data.data;
                } else {
                    return null;
                }
            }
        }).catch(error => {
            throw error;
        });
    }
    static setLabelStyle(layerId?: number, style?: string, is_label_visible?: boolean): Promise<RestData<OGLayerModel>> {
        return axios({
            data: {
                is_label_visible: is_label_visible,
                style: style
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/layer/" + layerId + "/setLabelStyle",
        }).then(async (xhr: AxiosResponse<RestData<OGLayerModel>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
        }).catch(error => {
            throw error;
        });
    }

    static setStyle(layerId?: number, style?: string, anchorX?: number, anchorY?: number): Promise<RestData<OGLayerModel> | RestError> {
        return axios({
            data: {
                anchorX: anchorX,
                anchorY: anchorY,
                style: style
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/layer/" + layerId + "/setStyle",
        }).then(async (xhr: AxiosResponse<RestData<OGLayerModel>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
        }).catch(error => {
            throw error;
        });
    }
}

export { LayerService };