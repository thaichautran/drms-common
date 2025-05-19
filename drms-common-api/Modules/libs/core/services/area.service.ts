import axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../enums/enums";
import { AreaModel } from "../models/area.model";
import { RestData } from "../models/base-response.model";

class AreaService {
    static COMMUNES: string = "/api/region/communes";
    static DISTRICTS: string = "/api/region/districts";
    static PROVINCES: string = "/api/region/provinces";
    static REGION: string = "/api/region";
    static SHAPE: string = "/api/region/shape";

    static communes(parent_id?: string, provinceCode?: string, keyword?: string, checkPermission: boolean = false): Promise<AreaModel[]> {
        return axios.get(`${AreaService.COMMUNES}`, {
            method: "GET",
            params: {
                checkPermission: checkPermission,
                parent_id: parent_id,
                provinceCode: provinceCode,
                q: keyword
            }
        }).then(async (xhr: AxiosResponse<RestData<AreaModel[]>>) => {
            if (xhr.status === 200) {
                if (xhr.data.status === EnumStatus.OK && xhr.data.data) {
                    return xhr.data.data;
                } else {
                    return [];
                }
            }

        }).catch((e) => {
            throw e;
        });
    }

    static districts(parent_id?: string, keyword?: string, checkPermission: boolean = false): Promise<AreaModel[]> {
        return axios.get(`${AreaService.DISTRICTS}`, {
            method: "GET",
            params: {
                checkPermission: checkPermission,
                parent_id: parent_id,
                q: keyword
            }
        }).then(async (xhr: AxiosResponse<RestData<AreaModel[]>>) => {
            if (xhr.status === 200) {
                if (xhr.data.status === EnumStatus.OK && xhr.data.data) {
                    return xhr.data.data;
                } else {
                    return [];
                }
            }

        }).catch((e) => {
            throw e;
        });
    }

    static get(id: string): Promise<AreaModel> {
        return axios.get(`${AreaService.REGION}/${id}`, {
            method: "GET"
        }).then(async (xhr: AxiosResponse<RestData<AreaModel>>) => {
            if (xhr.status === 200) {
                if (xhr.data.status === EnumStatus.OK && xhr.data.data) {
                    return xhr.data.data;
                } else {
                    return null;
                }
            }
        }).catch((e) => {
            throw e;
        });
    }

    static provinces(keyword?: string, checkPermission: boolean = false): Promise<AreaModel[]> {
        // const searchParams = new URLSearchParams({
        //     q: keyword
        // });
        return axios.get(`${AreaService.PROVINCES}`, {
            // data: searchParams,
            method: "GET",
            params: {
                checkPermission: checkPermission,
                q: keyword
            }
        }).then(async (xhr: AxiosResponse<RestData<AreaModel[]>>) => {
            if (xhr.status === 200) {
                if (xhr.data.status === EnumStatus.OK && xhr.data.data) {
                    return xhr.data.data;
                } else {
                    return [];
                }
            }

        }).catch((e) => {
            throw e;
        });
    }

    static shape(area_id: string, f?: string): Promise<string> {
        return axios.get(`${AreaService.SHAPE}`, {
            method: "GET",
            params: {
                area_id: area_id,
            }
        }).then(async (xhr: AxiosResponse<RestData<string>>) => {
            if (xhr.status === 200) {
                if (xhr.data.status === EnumStatus.OK && xhr.data.data) {
                    return xhr.data.data;
                } else {
                    return undefined;
                }
            }
        }).catch((e) => {
            throw e;
        });
    }
}

export { AreaService };
