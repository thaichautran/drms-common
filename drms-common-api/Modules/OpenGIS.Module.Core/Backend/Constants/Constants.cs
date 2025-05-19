using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace OpenGIS.Module.Core.Constants
{
    public static class Constants
    {
        public static string PROVINCE_ID = "01";
        public static int INVALID_TOKEN_ERROR_CODE = 498;
        public static string IMG_TYPE = "image/*";
        public const string AUTH_SCHEMES = "Identity.Application" + "," + JwtBearerDefaults.AuthenticationScheme;
        public const string FILTER_EXPRESSION = @"^(?!.*<.*>).*$";
        public const string FILTER_EXPRESSION_ERROR = "Nội dung không được phép có kí tự đặc biệt.";
        public const string URL_VALIDATE_ERROR = "Đường dẫn không được kiểm duyệt! Vui lòng thử lại.";
    }
}