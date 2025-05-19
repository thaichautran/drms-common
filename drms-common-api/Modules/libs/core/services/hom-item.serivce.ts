import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../enums/enums";
import { OGUtils } from "../helpers/utils";
import { RestData, RestPagedDatatable } from "../models/base-response.model";
import { OGHomeItemModel } from "../models/home-item.model";

class HomeItemService {
    static delete(item: OGHomeItemModel): Promise<void> {
        if (!item || item.id === 0) {
            return undefined;
        }
        return Axios({
            data: item,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/home-items/delete",
        });
    }

    static get(id: number): Promise<OGHomeItemModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get("/api/home-items/" + id).then(async (xhr: AxiosResponse<RestData<OGHomeItemModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static getByUrl(url: string): Promise<OGHomeItemModel> {
        if (!url) {
            return undefined;
        }
        return Axios.get("/api/home-items/get-by-url?url=" + url).then(async (xhr: AxiosResponse<RestData<OGHomeItemModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(item: OGHomeItemModel): Promise<RestData<OGHomeItemModel>> {
        return Axios.post("/api/home-items/save", item).then(async (xhr: AxiosResponse<RestData<OGHomeItemModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if(xhr.data.status === EnumStatus.OK) {
                    OGUtils.alert("Lưu module thành công!");
                    return xhr.data;
                } else {
                    OGUtils.error("Lưu module thất bại!");
                }
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGHomeItemModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/home-items/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGHomeItemModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

}

export { HomeItemService };