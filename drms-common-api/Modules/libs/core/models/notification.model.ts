interface UserNotification {
    content: string,
    devices: string[],
    is_read?: boolean;
    title: string,
    type: string,
}

interface UserDevicesToken {
    device_name: string,
    device_token: string,
    platform: string
    user_id?: string,
}

interface PushUserNotification {
    content: string,
    devices: string[],
    title: string,
    type: string,
    user_id: string[],
}

export { PushUserNotification, UserDevicesToken, UserNotification };