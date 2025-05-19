import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../enums/enums";
import { OGUtils } from "../helpers/utils";
import { RestData, RestPagedDatatable } from "../models/base-response.model";
import { OGBaseLayerModel, OGLayerModel } from "../models/layer.model";
import { OGMapBaseLayerModel, OGMapLayerModel, OGMapModel, OGMapTableModel } from "../models/map.model";
import { OGTableModel } from "../models/table.model";
class MapService {
    static createMapFromTemplates (map: OGMapModel): Promise<RestData<OGMapModel>> {
        return Axios({
            data: map,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/map/create-from-templates",
        }).then(async (xhr: AxiosResponse<RestData<OGMapModel>>) => {
            if (xhr.status === 200) {
                if(xhr.data.status === EnumStatus.OK){
                    OGUtils.alert("Tạo mới bản đồ chuyên đề thành công!");
                } else {
                    OGUtils.error(xhr.data["errors"][0].message);
                }
                return xhr.data;
            }
            OGUtils.error("Đã xảy ra lỗi, vui lòng thử lại!");
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static delete(map: OGMapModel): Promise<void> {
        if (!map || map.id === 0) {
            return undefined;
        }
        return Axios({
            data: map,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/map/delete",
        });
    }

    static deleteBaseLayer(mapBaseLayer : OGMapBaseLayerModel): Promise<void> {
        if (!mapBaseLayer || mapBaseLayer.map_id === 0 || mapBaseLayer.base_layer_id === 0) {
            return undefined;
        }
        return Axios({
            data: mapBaseLayer,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/map/base-layer/delete",
        });
    }

    static deleteLayer(mapLayer: OGMapLayerModel): Promise<void> {
        if (!mapLayer || mapLayer.map_id === 0 || mapLayer.layer_id === 0) {
            return undefined;
        }
        return Axios({
            data: mapLayer,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/map/layer/delete",
        });
    }

    static deleteTable(mapTable: OGMapTableModel): Promise<void> {
        if (!mapTable || mapTable.map_id === 0 || mapTable.table_id === 0) {
            return undefined;
        }
        return Axios({
            data: mapTable,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/map/table/delete",
        });
    }

    static get(id: number): Promise<OGMapModel> {
        if (!id || id === 0) {
            return undefined;
        }
        return Axios.get("/api/map/" + id).then(async (xhr: AxiosResponse<RestData<OGMapModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static getBaseLayerTree(mapId: number): Promise<RestData<OGBaseLayerModel[]>> {
        return Axios.get("/api/map/base-layers-tree/" + mapId).then(async (xhr: AxiosResponse<RestData<OGBaseLayerModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static getBaseLayers(mapId: number, args): Promise<RestPagedDatatable<OGMapModel[]>> {
        return Axios({
            data: args,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "GET",
            url: "/api/map/base-layers/" + mapId,
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGMapModel[]>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static getLayerTree(mapId: number): Promise<RestData<OGLayerModel[]>> {
        return Axios.get("/api/map/layers-tree/" + mapId).then(async (xhr: AxiosResponse<RestData<OGLayerModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    
    static getLayers(mapId: number, args): Promise<RestPagedDatatable<OGMapModel[]>> {
        return Axios({
            data: args,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "GET",
            url: "/api/map/layers/" + mapId,
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGMapModel[]>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static getRegionTree(mapId: number): Promise<RestData<OGBaseLayerModel[]>> {
        return Axios.get("/api/map/regions-tree/" + mapId).then(async (xhr: AxiosResponse<RestData<OGBaseLayerModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static getTableTree(mapId: number): Promise<RestData<OGTableModel[]>> {
        return Axios.get("/api/map/tables-tree/" + mapId).then(async (xhr: AxiosResponse<RestData<OGTableModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static getTables(mapId: number, args): Promise<RestPagedDatatable<OGMapModel[]>> {
        return Axios({
            data: args,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "GET",
            url: "/api/map/tables/" + mapId,
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGMapModel[]>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(args): Promise<RestPagedDatatable<OGMapModel[]>> {
        return Axios({
            data: args,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/map/list",
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGMapModel[]>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static save(map: OGMapModel): Promise<OGMapModel> {
        return Axios({
            data: map,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/map/save",
        }).then(async (xhr: AxiosResponse<RestData<OGMapModel>>) => {
            if (xhr.status === 200) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static saveBaseLayer(map: OGMapModel): Promise<RestData<OGMapModel>> {
        return Axios({
            data: map,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/map/base-layer/save",
        }).then(async (xhr: AxiosResponse<RestData<OGMapModel>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static saveLayer(map: OGMapModel): Promise<RestData<OGMapModel>> {
        return Axios({
            data: map,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/map/layer/save",
        }).then(async (xhr: AxiosResponse<RestData<OGMapModel>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static saveRegions(map: OGMapModel): Promise<RestData<OGMapModel>> {
        return Axios({
            data: JSON.stringify(map),
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: "/api/map/regions/save",
        }).then(async (xhr: AxiosResponse<RestData<OGMapModel>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static saveTable(map: OGMapModel): Promise<RestData<OGMapModel>> {
        return Axios({
            data: map,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/map/table/save",
        }).then(async (xhr: AxiosResponse<RestData<OGMapModel>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { MapService };