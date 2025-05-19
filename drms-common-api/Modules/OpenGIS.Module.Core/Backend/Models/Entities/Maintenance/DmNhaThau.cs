using Microsoft.AspNetCore.Components.Web.Virtualization;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("v_dm_nhathau")]
    public class DmNhaThauViewModel
    {
        public int code { get; set; }
        public string value { get; set; } = string.Empty;
        public string loaikehoach { get; set; } = string.Empty;
    }
}
