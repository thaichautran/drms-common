using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using System.Text.Json.Serialization;
using VietGIS.Infrastructure.Models.DTO;
using VietGIS.Infrastructure.Identity.Entities;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("user_audit", Schema = "identity")]
    public class UserAudit
    {
        [Key]
        [JsonIgnore]
        public int user_audit_id { get; set; }
        [ForeignKey(nameof(user))]
        public string? user_id { get; set; }
        public DateTimeOffset timestamp { get; set; }
        public int? audit_event { get; set; }
        public string? ip_address { get; set; }
        [NotMapped]
        public ApplicationUser? user { get; set; }
        [NotMapped]
        public string? event_name
        {
            get
            {
                switch (audit_event)
                {
                    case (int)UserAuditEventType.Login:
                        return "Đăng nhập";
                    case (int)UserAuditEventType.FailedLogin:
                        return "Đăng nhập thất bại";
                    case (int)UserAuditEventType.LogOut:
                        return "Đăng xuất";
                    default:
                        return string.Empty;
                }
            }
        }
        [NotMapped]
        public string? full_username { get; set; }
    }

    public enum UserAuditEventType
    {
        Login = 1,
        FailedLogin = 2,
        LogOut = 3
    }
}
