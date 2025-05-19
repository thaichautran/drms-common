using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace OpenGIS.Module.Core.Models.Entities.Category
{
    [Table("ds_danhmuc", Schema = "category")]
    public class Category
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? ten_danhmuc { get; set; }
        public string? ten_bang { get; set; }
        public int? order_id { get; set; }
        public string schema { get; set; }
        [NotMapped]
        public string schemaAndTable
        {
            get
            {
                if (!string.IsNullOrEmpty(ten_bang))
                {
                    return $"category.{ten_bang}";
                }
                return string.Empty;
            }
        }
    }
}