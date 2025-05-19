using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VietGIS.Infrastructure.Identity.Entities;
using VietGIS.Infrastructure.Models.Regional;

namespace OpenGIS.Module.Core.Models
{
    [Table("user_infos", Schema = "identity")]
    public class UserInfo
    {
        [Key]
        public string? user_id { get; set; }

        public string? address { get; set; }

        public string? full_name { get; set; }
        [ForeignKey(nameof(province))]
        public string? province_code { get; set; }
        [ForeignKey(nameof(district))]
        public string? district_code { get; set; }
        [ForeignKey(nameof(commune))]
        public string? commune_code { get; set; }

        public virtual Province? province { get; set; }
        public virtual District? district { get; set; }
        public virtual Commune? commune { get; set; }
        public string? unit { get; set; }
        public string? position { get; set; }
        public bool? send_sms { get; set; }
        public bool? send_app { get; set; }
        public bool? send_mail { get; set; }
        public bool? bypass_approve { get; set; }
    }
}