using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.Core.Models
{
    [Table("table_histories", Schema = "core")]
    public class TableHistory
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        [ForeignKey(nameof(tableSchema))]
        public string? table_schema { get; set; }
        public string? table_name { get; set; }
        public string? old_data { get; set; }
        public string? new_data { get; set; }
        public string? action { get; set; }
        public DateTime? action_time { get; set; }
        [ForeignKey(nameof(userInfo))]
        public string? action_user { get; set; }
        public string? layer_name { get; set; }
        public virtual TableSchema? tableSchema { get; set; }
        public virtual UserInfo? userInfo { get; set; }
        [NotMapped]
        public string? action_time_str => action_time.HasValue ? action_time.Value.ToString("dd/MM/yyyy hh:mm:ss") : "";
        [NotMapped]
        public string action_text
        {
            get
            {
                switch (action?.ToLower())
                {
                    case "insert":
                        return "Thêm mới";
                    case "update":
                        return "Cập nhật";
                    case "delete":
                        return "Xóa";
                    default:
                        return action;
                }
            }

        }
    }
}
