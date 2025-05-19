using System;
using System.Collections.Generic;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.Core.Models.DTO
{
    public class SearchFeatureDTO
    {
        public int? layer_id { get; set; }
        public int? table_id { get; set; }
        public string? feature_id { get; set; }
    }
    public class SendNotificationDTO : SearchFeatureDTO
    {
        public List<string>? user_ids { get; set; }
    }
}
