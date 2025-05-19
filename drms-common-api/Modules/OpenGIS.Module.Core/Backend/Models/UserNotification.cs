using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace OpenGIS.Module.Core.Models
{
    [Table("user_notifications", Schema = "identity")]
    public class UserNotification
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? content { get; set; }
        public bool is_read { get; set; }
        public string? url { get; set; }
        public bool seen { get; set; }
        public bool is_expirated { get; set; }
        public string? name { get; set; }
        public DateTime sent_at { get; set; }
        public string? type { get; set; }
        public string? app_url { get; set; }
        public int icon_type { get; set; }
        public string? data { get; set; }
        // [JsonIgnore]
        public string? user_id { get; set; }
        public string? device_received { get; set; }
    }
}