import axios, { AxiosResponse } from "axios";
import { stringify } from "uuid";

import { EnumStatus } from "../enums/enums";
import { RestBase, RestData, RestError } from "../models/base-response.model";
import { UserDevicesToken, UserNotification } from "../models/notification.model";
class NotificationService {
    static delete(id): Promise<boolean> {
        return axios({
            data: {
                id: id
            },
            method: "DELETE",
            url: "/api/notification"
        }).then(async (xhr) => {
            const response: RestData<boolean> = xhr.data as RestData<boolean>;
            if (response.status === EnumStatus.OK) {
                return true;
            } else {
                return false;
            }
        }).catch(error => {
            throw error;
        });
    }
    static deleteAll(): Promise<boolean> {
        return fetch("/api/notification/delete-all", {
            method: "POST"
        }).then(async (xhr) => {
            const response: RestData<boolean> = await xhr.json();
            if (response.status === EnumStatus.OK) {
                return true;
            } else {
                return false;
            }
        }).catch(error => {
            throw error;
        });
    }
    static device(item: UserDevicesToken): Promise<RestBase | RestError> {
        //const formData = Utils.jsonToFormData(item);
        return fetch("/api/user/device-token", {
            body: JSON.stringify(item),
            headers: new Headers({
                "content-type": "application/json"
            }),
            method: "POST"
        }).then(async (xhr) => {
            return await xhr.json();
        }).catch(error => {
            throw error;
        });
    }
    static pushNotification(data: UserNotification): Promise<RestData<boolean> | RestError> {
        return axios({
            data: data,
            method: "POST",
            url: "/api/notification/send"
        }).then(async (xhr: AxiosResponse) => {
            const response = xhr.data;
            return response;
        }).catch(error => {
            throw error;
        });
    }

    static read(ids: number[]): Promise<RestBase | RestError> {
        return fetch("/api/notification/read", {
            body: JSON.stringify(ids),
            headers: new Headers({
                "content-type": "application/json"
            }),
            method: "POST",
        }).then(async xhr => {
            return await xhr.json();
        }).catch(e => {
            throw e;
        });
    }
    static unread(): Promise<RestData<number>> {
        return fetch("/api/notification/unread-count", {
            method: "GET"
        }).then(async (xhr) => {
            const response: RestData<number> = await xhr.json();
            if (response.status === EnumStatus.OK) {
                return response as RestData<number>;
            } else {
                return null;
            }
        }).catch(error => {
            throw error;
        });
    }
}

export { NotificationService };