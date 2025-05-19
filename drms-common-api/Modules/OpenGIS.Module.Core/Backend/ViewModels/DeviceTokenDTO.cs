using System.ComponentModel.DataAnnotations;

namespace OpenGIS.Module.Core.ViewModels
{
    public class DeviceTokenDTO
    {
        public virtual string? device_token { get; set; }
        public virtual string? platform { get; set; }
        public virtual string? device_name { get; set; }
    }
}