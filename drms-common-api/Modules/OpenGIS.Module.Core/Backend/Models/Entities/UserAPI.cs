using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using OpenGIS.Module.Core.Entities;
using VietGIS.Infrastructure.Models.Database.Map;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("user_apis", Schema = "public")]
    public class UserAPI
    {
        [Key]
        public string user_id { get; set; }
        [Key]
        [ForeignKey(nameof(api))]
        public int api_id { get; set; }
        [Key]
        public int layer_id { get; set; }

        
        public virtual ApiInfo api { get; set; }
        
        public virtual Layer layer { get; set; }
    }
}