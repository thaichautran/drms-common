namespace OpenGIS.Module.Core.Models.DTO.Request
{
    public class RelationSearchParameter
    {
        public int? skip { get; set; }
        public int? take { get; set; }
        public string? keyword { get; set; }
        public int tableId { get; set; }
        public int layerId { get; set; }
        public string featureId { get; set; }
        public int relationTableId { get; set; }
    }
}