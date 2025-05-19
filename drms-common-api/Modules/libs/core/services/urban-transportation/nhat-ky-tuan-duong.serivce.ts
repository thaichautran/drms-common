import Axios, { AxiosResponse } from "axios";

import { RestData, RestPagedDatatable } from "../../models/base-response.model";
import { OGSoNhatKyTuanDuongModel, OGSuCoViPhamTuanDuongModel } from "../../models/urban-transportation/nhat-ky-tuan-duong.model";


class NhatKyTuanDuongService {
    static delete(data: OGSoNhatKyTuanDuongModel): Promise<void> {
        return Axios.delete("/api/giao-thong/nhat-ky-tuan-duong/su-co/" + data.id);
    }

    static get(id: number): Promise<OGSoNhatKyTuanDuongModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/giao-thong/nhat-ky-tuan-duong/${id}`).then(async (xhr: AxiosResponse<RestData<OGSoNhatKyTuanDuongModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGSoNhatKyTuanDuongModel): Promise<OGSoNhatKyTuanDuongModel> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/giao-thong/nhat-ky-tuan-duong/save"
        }).then(async (xhr: AxiosResponse<RestData<OGSoNhatKyTuanDuongModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGSoNhatKyTuanDuongModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/giao-thong/nhat-ky-tuan-duong/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGSoNhatKyTuanDuongModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

class SuCoTuanDuongService {
    static delete(data: OGSuCoViPhamTuanDuongModel): Promise<void> {
        return Axios.delete("/api/giao-thong/su-co-tuan-duong/" + data.id);
    }

    static get(id: number): Promise<OGSuCoViPhamTuanDuongModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/giao-thong/su-co-tuan-duong/${id}`).then(async (xhr: AxiosResponse<RestData<OGSuCoViPhamTuanDuongModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGSuCoViPhamTuanDuongModel): Promise<OGSuCoViPhamTuanDuongModel> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/giao-thong/su-co-tuan-duong/save"
        }).then(async (xhr: AxiosResponse<RestData<OGSuCoViPhamTuanDuongModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGSuCoViPhamTuanDuongModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/giao-thong/su-co-tuan-duong/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGSuCoViPhamTuanDuongModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { NhatKyTuanDuongService, SuCoTuanDuongService };