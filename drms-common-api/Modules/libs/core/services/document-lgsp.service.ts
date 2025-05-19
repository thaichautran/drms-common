import Axios, { AxiosResponse } from "axios";

import { RestData } from "../models/base-response.model";
import { DocumentLGSP } from "../models/document-lgsp.model";

class DocumentLGSPService {
    static delete(document: DocumentLGSP): Promise<RestData<DocumentLGSP>> {
        return Axios.delete("/api/hoso-lgsp/" + document.id).then(async (xhr: AxiosResponse<RestData<DocumentLGSP>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static get(id: number): Promise<DocumentLGSP> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/hoso-lgsp/${id}`).then(async (xhr: AxiosResponse<RestData<DocumentLGSP>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(document: FormData): Promise<RestData<DocumentLGSP>> {
        return Axios({
            data: document,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/hoso-lgsp/saveOrUpdate"
        }).then(async (xhr: AxiosResponse<RestData<DocumentLGSP>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<DocumentLGSP[]> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/hoso-lgsp/getData"
        }).then(async (xhr: AxiosResponse<RestData<DocumentLGSP[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return [];
        }).catch(e => {
            throw e;
        });
    }
}

export { DocumentLGSPService };