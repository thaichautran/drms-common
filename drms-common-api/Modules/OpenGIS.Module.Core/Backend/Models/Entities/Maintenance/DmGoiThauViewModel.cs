using Microsoft.AspNetCore.Components.Web.Virtualization;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("v_dm_goithau")]
    public class DmGoiThauViewModel
    {
        public string magoithau { get; set; } = string.Empty;
        public string tengoithau { get; set; } = string.Empty;
        public string loaikehoach { get; set; } = string.Empty;
    }
}
