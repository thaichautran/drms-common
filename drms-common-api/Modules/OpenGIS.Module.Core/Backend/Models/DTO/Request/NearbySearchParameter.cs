namespace OpenGIS.Module.Core.Models.DTO.Request
{
    public class NearbySearchParameter
    {
        public string geom { get; set; }
        public double radius { get; set; }
        public bool cross_schema { get; set; } = false;
        public string f { get; set; } = "xlsx";
    }
}