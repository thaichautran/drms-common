using OpenGIS.Module.Core.Attributes;

namespace OpenGIS.Module.Core.Enums
{
    public enum EnumRouteTurnTypes : int
    {
        [DisplayName("Quay đầu lại")]
        QUAY_DAU = 0,
        [DisplayName("Sang làn trái")]
        SANG_LAN_TRAI = 1,
        [DisplayName("Sang làn phải")]
        SANG_LAN_PHAI = 2,
        [DisplayName("Rẽ trái")]
        RE_TRAI = 3,
        [DisplayName("Rẽ phải")]
        RE_PHAI = 4,
        [DisplayName("Hướng sang trái")]
        HUONG_SANG_TRAI = 5,
        [DisplayName("Hướng sang phải")]
        HUONG_SANG_PHAI = 6,
        [DisplayName("Đi thẳng")]
        DI_THANG = 7
    }
}
