using System;
using System.Collections.Generic;
using OpenGIS.Module.Core.Models.DevExtreme;

namespace OpenGIS.Module.Core.Models.DTO
{
    public class UserAuditListDxDTO : DxGridDTO
    {
        public string? user_id { get; set; }
        public DateTime? start_date { get; set; }
        public DateTime? end_date { get; set; }
        public int? audit_event { get; set; } = 0;
    }
}