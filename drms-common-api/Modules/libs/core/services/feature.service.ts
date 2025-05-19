import axios, { AxiosError, AxiosResponse, isCancel } from "axios";

import { EnumStatus } from "../enums/enums";
import { RestBase, RestData, RestError, RestPagedDatatable } from "../models/base-response.model";
import { FeatureFile, FeatureResponse } from "../models/feature.model";
import { OGKeHoachKiemTraModel } from "../models/kiem-tra/ke-hoach-kiem-tra.model";
import { OGPhieuKiemTraModel } from "../models/kiem-tra/kiem-tra.model";

class FeatureService {
    static getFeatureFiles(layerId: number, tableId: number, featureId: number | string): Promise<object> {
        return axios({
            data: {
                feature_id: featureId,
                layer_id: layerId,
                table_id: tableId
            },
            method: "POST",
            url: "/api/feature/getFiles"
        }).then((xhr: AxiosResponse<RestData<object>>) => {
            if (xhr.status === 200) {
                if (xhr.data.status === EnumStatus.OK && xhr.data.data) {
                    return xhr.data.data;
                } else {
                    return null;
                }
            }
            return null;
        }).catch((error: AxiosError) => {
            if (isCancel(error)) {
                return null;
            } else {
                throw error;
            }
        });
    }
    static getMaintenancePlans(params): Promise<RestPagedDatatable<OGKeHoachKiemTraModel[]>> {
        if (!params) {
            return undefined;
        } else {
            return axios.post("/api/feature/maintenance-plans", params).then((xhr: AxiosResponse<RestPagedDatatable<OGKeHoachKiemTraModel[]>>) => {
                if (xhr.status === 200) {
                    if (xhr.data.status === EnumStatus.OK && xhr.data.data) {
                        return xhr.data;
                    } else {
                        return undefined;
                    }
                }
                return undefined;
            }).catch((error: AxiosError) => {
                if (isCancel(error)) {
                    return undefined;
                } else {
                    throw error;
                }
            });
        }
    }
    static getMaintenances(params): Promise<RestPagedDatatable<OGPhieuKiemTraModel[]>> {
        if (!params) {
            return undefined;
        } else {
            return axios.post("/api/feature/maintenances", params).then((xhr: AxiosResponse<RestPagedDatatable<OGPhieuKiemTraModel[]>>) => {
                if (xhr.status === 200) {
                    if (xhr.data.status === EnumStatus.OK && xhr.data.data) {
                        return xhr.data;
                    } else {
                        return undefined;
                    }
                }
                return undefined;
            }).catch((error: AxiosError) => {
                if (isCancel(error)) {
                    return undefined;
                } else {
                    throw error;
                }
            });
        }
    }
    static notify(layerId: number, tableId: number, featureId: number | string, user_ids?: string[]): Promise<RestBase | RestError> {
        return axios({
            data: {
                feature_id: featureId,
                layer_id: layerId,
                table_id: tableId,
                user_ids: user_ids,
            },
            method: "POST",
            url: "/api/feature/notify"
        }).then((xhr: AxiosResponse<RestBase | RestError>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
            return null;
        }).catch((error: AxiosError) => {
            if (isCancel(error)) {
                return null;
            } else {
                throw error;
            }
        });
    }
    static queryFeature(layerId: number, tableId: number, featureId: number | string): Promise<FeatureResponse> {
        return axios({
            data: {
                feature_id: featureId,
                layer_id: layerId,
                table_id: tableId
            },
            method: "POST",
            url: "/api/feature/query-feature"
        }).then((xhr: AxiosResponse<RestData<FeatureResponse>>) => {
            if (xhr.status === 200) {
                if (xhr.data.status === EnumStatus.OK && xhr.data.data) {
                    return xhr.data.data;
                } else {
                    return null;
                }
            }
            return null;
        }).catch((error: AxiosError) => {
            if (isCancel(error)) {
                return null;
            } else {
                throw error;
            }
        });
    }
}

export { FeatureService };