using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VietGIS.Infrastructure.Models.DTO.Request;

namespace OpenGIS.Module.Core.ViewModels.DatatableParams
{
    public class PrimeVueDataTableParams : DataTableParameters
    {
        /// <summary>
        /// Tên trường dữ liệu sắp xếp
        /// </summary>
        public string? sortField { get; set; }
        /// <summary>
        /// Kiểu sắp xếp: DESC/ASC
        /// </summary>
        public string? sortOrder { get; set; }
        public IEnumerable<PrimeVueFieldOrder>? orders { get; set; }
        public IEnumerable<PrimeVueMultiSortMeta>? multiSortMeta { get; set; }
    }
    public class PrimeVueFieldOrder
    {
        /// <summary>
        /// Tên trường dữ liệu sắp xếp
        /// </summary>
        public string? sortField { get; set; }
        /// <summary>
        /// Kiểu sắp xếp: DESC/ASC
        /// </summary>
        public string? sortOrder { get; set; }
    }
    public class PrimeVueMultiSortMeta
    {
        /// <summary>
        /// Tên trường dữ liệu sắp xếp
        /// </summary>
        public string? field { get; set; }
        /// <summary>
        /// Kiểu sắp xếp: DESC/ASC
        /// </summary>
        public int? order { get; set; }
    }
    public class HDSDDatatableParam : PrimeVueDataTableParams
    {
        public int? parentId { get; set; }
        public int? titleLevel { get; set; }
    }
}