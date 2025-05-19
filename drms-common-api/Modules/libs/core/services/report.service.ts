import axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../enums/enums";
import { OGUtils } from "../helpers/utils";
import { RestData, RestPagedDatatable } from "../models/base-response.model";
import { OGSynthesisReportModel } from "../models/report.model";
import { LayerGroupTreeItem } from "../models/tree-item.model";

class ReportService {
    static delete(data): Promise<RestData<OGSynthesisReportModel>> {
        if (data) {
            return axios({
                data: data,
                method: "POST",
                url: "/api/report/delete",
            }).then(async (xhr: AxiosResponse<RestData<OGSynthesisReportModel>>) => {
                if (xhr.status === 200 && xhr.data) {
                    return xhr.data;
                }
            });
        } else {
            return undefined;
        }
    }

    static get(id: number): Promise<OGSynthesisReportModel> {
        if (id === 0) {
            return undefined;
        }
        return axios.get(`/api/report/${id}`).then(async (xhr: AxiosResponse<RestData<OGSynthesisReportModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static getTree(params): Promise<LayerGroupTreeItem[]> {
        return axios.get("/api/report/get-trees", {
            method: "GET",
            params: params
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

    static insert(data): Promise<RestData<OGSynthesisReportModel>> {
        return axios.post("/api/report/save", data).then(async (xhr: AxiosResponse<RestData<OGSynthesisReportModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if(xhr.data.status == EnumStatus.OK) {
                    OGUtils.alert("Lưu báo cáo thành công!");
                } else {
                    OGUtils.error(xhr.data["errors"][0].message);
                }
                return xhr.data;
            } else {
                OGUtils.error("Đã xảy ra lỗi, vui lòng thử lại!");
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGSynthesisReportModel[]>> {
        return axios.post("/api/report/get-reports", params).then(async (xhr: AxiosResponse<RestPagedDatatable<OGSynthesisReportModel[]>>) => {
            if (xhr.status === 200 && xhr.data.status === EnumStatus.OK) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static listDistinctValues(tableName?: string, q?: string, page?: number, pageSize?: number): Promise<RestPagedDatatable<string>> {
        return axios.get("/api/report/distinct-values", {
            params: {
                page: page || 1,
                pageSize: pageSize || 25,
                q: q,
                tableName: tableName
            }
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<string>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}


export { ReportService };