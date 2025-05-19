using Microsoft.AspNetCore.Components.Web.Virtualization;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("dm_hangmuccongviec", Schema = "maintenance")]
    public class DmHangMucCongViec
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public int parent_id { get; set; }
        public string code { get; set; } = string.Empty;
        public string value { get; set; } = string.Empty;
        public string loaikehoach { get; set; } = string.Empty;
        public string donvi_tinh { get; set; } = string.Empty;
        public double? don_gia { get; set; }
        public double? he_so { get; set; }
        public int order { get; set; }
    }
}
