using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace OpenGIS.Module.Core.Models.Entities
{
    public class CategoryBaseEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }

        [Required]
        [StringLength(100, ErrorMessage = "Tên danh mục không được quá 100 kí tự.")]
        public string mo_ta { get; set; }
    }
}
