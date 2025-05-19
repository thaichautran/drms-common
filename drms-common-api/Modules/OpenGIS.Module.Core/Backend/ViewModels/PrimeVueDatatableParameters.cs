using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VietGIS.Infrastructure.Models.DTO.Response;

namespace OpenGIS.Module.Core.ViewModels
{
    public class PrimeVueDatatableParameters
    {
        /// <summary>
        ///  thứ tự bản ghi đầu tiên của bảng
        ///  tương tự "start" như datatables.net
        /// </summary>
        public int first { get; set; }
        /// <summary>
        /// số bản ghi trên 1 trang
        /// tương tự "leghth" như datatables.net
        /// </summary>
        public int rows { get; set; }
        /// <summary>
        /// trang hiện tại
        /// </summary>
        public int page { get; set; }
        /// <summary>
        /// Tên trường dữ liệu sắp xếp
        /// </summary>
        public string? sortField { get; set; }
        /// <summary>
        /// Kiểu sắp xếp: DESC/ASC
        /// </summary>
        public string? sortOrder { get; set; }
        /// <summary>
        /// Tìm kiếm từ khóa
        /// </summary>
        public string? keyword { get; set; }
    }
    public class RestPagedVueDataTable<T> : RestPagedDataTable<T> where T : class
    {
        public int totalRecords { get; set; }
        public RestPagedVueDataTable()
            : base("OK")
        {
        }

        public RestPagedVueDataTable(string status)
            : base(status)
        {
        }
    }
    public class PSuCoParams : PrimeVueDatatableParameters
    {
        public DateTime? from { get; set; }
        public DateTime? to { get; set; }
        public string? districtCode { get; set; }
        public string? communeCode { get; set; }
    }
    public class PScadaDataParams : PrimeVueDatatableParameters
    {
        public DateTimeOffset? from { get; set; }
        public DateTimeOffset? to { get; set; }
        public string? scadaCode { get; set; }
    }

}