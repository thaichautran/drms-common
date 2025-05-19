import Axios, { AxiosResponse } from "axios";
import axios from "axios";

import { EnumStatus } from "../enums/enums";
import { RestBase, RestData, RestError } from "../models/base-response.model";
import { OGDocumentModel } from "../models/document.model";

class DocumentService {
    static BASE_PATH = "/api/hoSo";
    static delete(document: OGDocumentModel): Promise<RestData<OGDocumentModel>> {
        return Axios.delete("/api/hoSo/" + document.id).then(async (xhr: AxiosResponse<RestData<OGDocumentModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static get(id: number): Promise<OGDocumentModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/hoSo/${id}`).then(async (xhr: AxiosResponse<RestData<OGDocumentModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static insert(document: FormData): Promise<RestData<OGDocumentModel> | RestError> {
        return Axios({
            data: document,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/hoSo/saveOrUpdate"
        }).then(async (xhr: AxiosResponse<RestData<OGDocumentModel> | RestError>) => {
            return xhr.data;
        }).catch<RestError>(e => {
            return {
                errors: [e.message],
                status: EnumStatus.ERROR
            };
        });
    }

    static list(params): Promise<OGDocumentModel[]> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/hoSo/getData"
        }).then(async (xhr: AxiosResponse<RestData<OGDocumentModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return [];
        }).catch(e => {
            throw e;
        });
    }

    static notify(hoSoId: number, userId?: string, isSuccess?: boolean): Promise<RestBase | RestError> {
        return axios({
            data: {
                hoSoId: hoSoId,
                isSuccess: isSuccess,
                userId: userId,
            },
            method: "POST",
            url: "/api/hoSo/notify"
        }).then((xhr: AxiosResponse<RestBase | RestError>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
            return null;
        }).catch((error) => {
            throw error;
        });
    }
}

export { DocumentService };