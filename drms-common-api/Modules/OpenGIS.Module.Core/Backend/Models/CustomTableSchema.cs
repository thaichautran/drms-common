using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using VietGIS.Infrastructure.Models.Database;

namespace Backend.Models
{
    [Table("table_schemas", Schema = "public")]
    public class CustomTableSchema : TableSchema
    {
        public bool is_active { get; set; }
        public bool is_locked { get; set; }
    }
}