
import { EnumStatus } from "../enums/enums";
import { RestData, RestError } from "../models/base-response.model";
import { UploadData } from "../models/upload.model";

class UploadService {
    static DOCUMENT_PATH: string = "/_documents";
    static MEDIA_PATH: string = "/_images";
    static UPLOAD_DOCUMENT: string = "/_upload/documents";
    static UPLOAD_MEDIA: string = "/_upload/images";
    static documents(data: FormData): Promise<RestData<UploadData[]> | RestError> {
        return fetch(UploadService.UPLOAD_DOCUMENT, {
            body: data,
            method: "POST",
        }).then(async xhr => {
            const response: RestData<UploadData[]> = await xhr.json();
            if (response.status === EnumStatus.OK && response.data) {
                return response as RestData<UploadData[]>;
            } else {
                return response;
            }
        }).catch(error => {
            throw error;
        });
    }
    static images(data: FormData): Promise<RestData<UploadData[]> | RestError> {
        return fetch(UploadService.UPLOAD_MEDIA, {
            body: data,
            method: "POST",
        }).then(async xhr => {
            const response: RestData<UploadData[]> = await xhr.json();
            if (response.status === EnumStatus.OK && response.data) {
                return response as RestData<UploadData[]>;
            } else {
                return response;
            }
        }).catch(error => {
            throw error;
        });
    }
}

export { UploadService };