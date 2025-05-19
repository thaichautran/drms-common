using System;
using OpenGIS.Module.Core.Models.DevExtreme;

namespace OpenGIS.Module.Core.Models.DTO
{
    public class ProblemListDxDTO : DxGridDTO
    {
        public DateTime? start_date { get; set; }
        public DateTime? end_date { get; set; }
        public string? status { get; set; }
        public int[]? years { get; set; }
        public string? keyword { get; set; }
    }
}