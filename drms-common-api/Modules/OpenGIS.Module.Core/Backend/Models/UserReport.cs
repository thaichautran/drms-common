using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;

namespace OpenGIS.Module.Core.Models
{
    [Table("user_reports", Schema = "public")]
    public class UserReport
    {
        [Key]
        public string user_id { get; set; } = string.Empty;
        [Key]
        [ForeignKey(nameof(report))]
        public int report_id { get; set; }
        public virtual BaoCao? report { get; set; }
    }
}