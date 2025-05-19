import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../enums/enums";
import { OGUtils } from "../helpers/utils";
import { RestData } from "../models/base-response.model";
import { OGBaseLayerModel } from "../models/layer.model";

class BaseLayerService {
    static delete(baseLayer: OGBaseLayerModel): Promise<void> {
        if (!baseLayer || baseLayer.id === 0) {
            return undefined;
        }
        return Axios({
            data: baseLayer,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/base-layer/delete",
        });
    }

    static get(id: number): Promise<OGBaseLayerModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get("/api/base-layer/" + id).then(async (xhr: AxiosResponse<RestData<OGBaseLayerModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(baseLayer: OGBaseLayerModel): Promise<OGBaseLayerModel> {
        return Axios.post("/api/base-layer/createOrUpdate", baseLayer).then(async (xhr: AxiosResponse<RestData<OGBaseLayerModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if(xhr.data.status === EnumStatus.OK) {
                    OGUtils.alert("Lưu lớp bản đồ thành công!");
                    return xhr.data.data;
                } else {
                    OGUtils.error("Lưu lớp bản đồ thất bại!");
                }
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestData<OGBaseLayerModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/base-layer/list"
        }).then(async (xhr: AxiosResponse<RestData<OGBaseLayerModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return {
                data: [],
                status: EnumStatus.ERROR,
                totalCount: 0
            };
        }).catch(e => {
            throw e;
        });
    }
}

export { BaseLayerService };