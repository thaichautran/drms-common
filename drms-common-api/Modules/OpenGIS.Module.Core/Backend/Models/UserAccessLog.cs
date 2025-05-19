using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace OpenGIS.Module.Core.Models
{
    [Table("user_access_logs", Schema = "identity")]
    public class UserAccessLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int user_access_log_id { get; set; }
        // [ForeignKey(nameof(userInfo))]
        public string? user_name { get; set; }
        public DateTime? timestamp { get; set; }
        public string? url { get; set; }
        public string? ip_address { get; set; }
        public string? user_agent { get; set; }
        public string? method { get; set; }
        // public virtual UserInfo? userInfo { get; set; }
    }
}
