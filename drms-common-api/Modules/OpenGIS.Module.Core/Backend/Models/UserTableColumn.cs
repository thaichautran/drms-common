using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;

namespace OpenGIS.Module.Core.Models
{
    [Table("user_table_columns", Schema = "public")]
    public class UserColumn
    {
        [Key]
        public string user_id { get; set; } = string.Empty;
        [Key]
        [ForeignKey(nameof(column))]
        public int column_id { get; set; }
        public virtual TableColumn? column { get; set; }
    }
}