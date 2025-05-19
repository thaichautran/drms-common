namespace OpenGIS.Module.Core.Models.DTO.Request
{
    public class AddColumnRequest
    {
        public string? column_name { get; set; }
        public string? name_vn { get; set; }
        public string? data_type { get; set; }
        public int? character_max_length { get; set; }
        public bool? is_nullable { get; set; }
        public bool? is_identity { get; set; }
        public bool? require { get; set; }
        public object? default_value { get; set; }
        public bool? visible { get; set; }
        public bool? has_category { get; set; }
        public int? order { get; set; }
        public string? formula { get; set; }
        public bool? is_searchable { get; set; }
        public bool? is_label { get; set; }
    }
}