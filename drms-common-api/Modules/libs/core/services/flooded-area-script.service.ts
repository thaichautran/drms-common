import Axios, { AxiosResponse } from "axios";

import { RestBase, RestData } from "../models/base-response.model";
import { OGFloodedAreaScriptModel } from "../models/urban-drainage/flooded-area-script/flooded-area-script.model";

class FloodedAreaScriptService {
    static BASE_URL: string = "/api/flooded-area-script/";
    static FLOODED_AREA_SCRIPT_LIST: string = "/api/flooded-area-script/list-data";

    static delete(document: string): Promise<RestBase> {
        return Axios({
            data: document,
            headers: {
                "Content-Type": "application/json"
            },
            method: "DELETE",
            url: FloodedAreaScriptService.BASE_URL,
        }).then(async (xhr: AxiosResponse<RestBase>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static get(id: number): Promise<OGFloodedAreaScriptModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`${FloodedAreaScriptService.BASE_URL}${id}`).then(async (xhr: AxiosResponse<RestData<OGFloodedAreaScriptModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(document: string): Promise<RestBase> {
        return Axios({
            data: document,
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: FloodedAreaScriptService.BASE_URL,
        }).then(async (xhr: AxiosResponse<RestBase>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<OGFloodedAreaScriptModel[]> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: FloodedAreaScriptService.FLOODED_AREA_SCRIPT_LIST
        }).then(async (xhr: AxiosResponse<RestData<OGFloodedAreaScriptModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return [];
        }).catch(e => {
            throw e;
        });
    }

    static update(document: string): Promise<RestBase> {
        return Axios({
            data: document,
            headers: {
                "Content-Type": "application/json"
            },
            method: "PUT",
            url: FloodedAreaScriptService.BASE_URL,
        }).then(async (xhr: AxiosResponse<RestBase>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    
    static upload(formData: FormData): Promise<RestBase>{
        return Axios({
            data: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: FloodedAreaScriptService.BASE_URL + "upload",
        }).then(async (xhr: AxiosResponse<RestBase>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
        }).catch(e => {
            throw e;
        }); 
    }
}

export { FloodedAreaScriptService };