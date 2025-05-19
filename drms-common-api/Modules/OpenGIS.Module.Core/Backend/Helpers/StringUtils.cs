using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using OfficeOpenXml;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.Core.Helpers
{
    public static class StringUtils
    {
        //hàm này sử dụng format input của google lat,lng
        public static bool ParseCoordinateFromStringGoogleFormat(string input, out float lng, out float lat)
        {
            string[] numbers = input.Split(',');
            lng = 0;
            lat = 0;
            if (float.TryParse(numbers[0], out lat) && float.TryParse(numbers[1], out lng))
            {
                return true;
            }
            return false;
        }

        public static string ReverseCommaString(string commaString)
        {
            if (string.IsNullOrEmpty(commaString))
            {
                return string.Empty;
            }
            return string.Join(",", commaString.Split(',').Reverse());
        }

        private static string DuplicateTicksForSql(this string s)
        {
            return s.Replace("'", "''");
        }

        /// <summary>
        /// Takes a List collection of string and returns a delimited string.  Note that it's easy to create a huge list that won't turn into a huge string because
        /// the string needs contiguous memory.
        /// </summary>
        /// <param name="list">The input List collection of string objects</param>
        /// <param name="qualifier">
        /// The default delimiter. Using a colon in case the List of string are file names,
        /// since it is an illegal file name character on Windows machines and therefore should not be in the file name anywhere.
        /// </param>
        /// <param name="insertSpaces">Whether to insert a space after each separator</param>
        /// <returns>A delimited string</returns>
        /// <remarks>This was implemented pre-linq</remarks>
        public static string ToDelimitedString(this List<string> list, string delimiter = ":", bool insertSpaces = false, string qualifier = "", bool duplicateTicksForSQL = false)
        {
            var result = new StringBuilder();
            for (int i = 0; i < list.Count; i++)
            {
                string initialStr = duplicateTicksForSQL ? list[i].DuplicateTicksForSql() : list[i];
                result.Append((qualifier == string.Empty) ? initialStr : string.Format("{1}{0}{1}", initialStr, qualifier));
                if (i < list.Count - 1)
                {
                    result.Append(delimiter);
                    if (insertSpaces)
                    {
                        result.Append(' ');
                    }
                }
            }
            return result.ToString();
        }

        /// <summary>
        /// Convert number to Roman
        /// </summary>
        /// <param name="number">Number</param>
        /// <returns>Roman</returns>
        public static string ToRoman(int number)
        {
            if ((number < 0) || (number > 3999)) throw new ArgumentOutOfRangeException(nameof(number), "insert value between 1 and 3999");
            if (number < 1) return string.Empty;
            if (number >= 1000) return "M" + ToRoman(number - 1000);
            if (number >= 900) return "CM" + ToRoman(number - 900);
            if (number >= 500) return "D" + ToRoman(number - 500);
            if (number >= 400) return "CD" + ToRoman(number - 400);
            if (number >= 100) return "C" + ToRoman(number - 100);
            if (number >= 90) return "XC" + ToRoman(number - 90);
            if (number >= 50) return "L" + ToRoman(number - 50);
            if (number >= 40) return "XL" + ToRoman(number - 40);
            if (number >= 10) return "X" + ToRoman(number - 10);
            if (number >= 9) return "IX" + ToRoman(number - 9);
            if (number >= 5) return "V" + ToRoman(number - 5);
            if (number >= 4) return "IV" + ToRoman(number - 4);
            if (number >= 1) return "I" + ToRoman(number - 1);
            return string.Empty;
        }

        public static string ParseFilter(TableInfo table, JToken? jTokens)
        {
            if (jTokens == null)
            {
                return "";
            }
            List<string> parsedFilter = new List<string>();
            if (jTokens is JArray && jTokens.Any(x => x.Type != JTokenType.String && x.Type != JTokenType.Null && x.Type != JTokenType.Boolean))
            {
                foreach (JToken? f in jTokens)
                {
                    if (f is JArray)
                    {
                        parsedFilter.Add(ParseFilter(table, f));
                    }
                    else if (f.Type == JTokenType.String)
                    {
                        parsedFilter.Add(f.Value<string?>() ?? "");
                    }
                    else if (f.Type == JTokenType.Boolean)
                    {
                        parsedFilter.Add(f.Value<string?>()?.ToLower() ?? "");
                    }
                }
            }
            else
            {
                if (jTokens.Count() == 3)
                {

                    if (jTokens[0].Value<string?>()?.ToLower() == "table_name")
                    {
                        string? value = jTokens[2].Value<string?>();
                        if (value != table.name_vn)
                        {
                            return "(1=2)";
                        }
                        return "(1=1)";
                    }
                    else if (jTokens[0].Value<string?>()?.ToLower() == "matuyen")
                    {
                        var tuyenColumn = table.columns.FirstOrDefault(x => x.column_name.Contains("matuyen"));
                        if (tuyenColumn != null)
                        {
                            string? op = jTokens[1].Value<string?>() ?? "<>";
                            if ((op == "<" || op == ">") && (tuyenColumn.data_type == EnumPgDataType.String || tuyenColumn.data_type == EnumPgDataType.Text))
                            {
                                op = "=";
                            }
                            else
                            {
                                op = "=";
                            }
                            string? value = jTokens[2].Value<string?>();
                            if (value == null)
                            {
                                return $"(\"{table.table_name}\".\"{tuyenColumn.column_name}\" IS NULL)";
                            }
                            else if (string.IsNullOrWhiteSpace(value))
                            {
                                return $"(\"{table.table_name}\".\"{tuyenColumn.column_name}\"::TEXT = '')";
                            }
                            return $"(\"{table.table_name}\".\"{tuyenColumn.column_name}\" {jTokens[1]} $${value}$$)";
                        }
                        else
                        {
                            return "1=2";
                        }
                    }
                    else
                    {
                        var column = table.columns.FirstOrDefault(x => x.column_name == jTokens[0].Value<string?>());
                        if (column == null)
                        {
                            return "1=2";
                        }
                        string? op = jTokens[1].Value<string?>() ?? "<>";
                        if ((op == "<" || op == ">" || op == "contains") && (column.data_type == EnumPgDataType.String || column.data_type == EnumPgDataType.Text))
                        {
                            op = "=";
                        }
                        else
                        {
                            op = "=";
                        }
                        string? value = jTokens[2].Value<string?>();

                        if (value == null)
                        {
                            return $"(\"{table.table_name}\".\"{column.column_name}\" IS NULL)";
                        }
                        else if (string.IsNullOrWhiteSpace(value))
                        {
                            return $"(\"{table.table_name}\".\"{column.column_name}\"::TEXT = '')";
                        }
                        return $"(\"{table.table_name}\".\"{jTokens[0]}\" {op} $${jTokens[2]}$$)";
                    }
                }
                else
                {
                    return "1=1";
                }
            }

            if (parsedFilter.Count <= 2)
            {
                return "1=1";
            }

            return string.Join(" ", parsedFilter);
        }
        public static string TableNameMapper(this Type type)
        {
            if (type == null)
            {
                return string.Empty;
            }
            dynamic tableattr = type?.GetCustomAttributes(false)?.SingleOrDefault(attr => attr?.GetType()?.Name == "TableAttribute");
            var name = string.Empty;

            if (tableattr != null)
            {
                name = tableattr.Name;
            }

            return name;
        }

        public static bool isValidPhone(this string? phoneNumber)
        {
            if (!string.IsNullOrWhiteSpace(phoneNumber))
            {
                return Regex.Matches(phoneNumber, @"^(0|84)(2(0[3-9]|1[0-689]|2[0-25-9]|3[2-9]|4[0-9]|5[124-9]|6[0369]|7[0-7]|8[0-9]|9[012346789])|3[2-9]|5[25689]|7[06-9]|8[0-9]|9[012346789])([0-9]{7})$", RegexOptions.Multiline).Count() > 0;
            }
            return false;
        }
    }

    public static class EpplusCsvConverter
    {
        public static byte[] ConvertToCsv(this ExcelPackage package)
        {
            var worksheet = package.Workbook.Worksheets[1];

            var maxColumnNumber = worksheet.Dimension.End.Column;
            var currentRow = new List<string>(maxColumnNumber);
            var totalRowCount = worksheet.Dimension.End.Row;
            var currentRowNum = 1;

            var memory = new MemoryStream();

            using (var writer = new StreamWriter(memory, Encoding.UTF8))
            {
                while (currentRowNum <= totalRowCount)
                {
                    BuildRow(worksheet, currentRow, currentRowNum, maxColumnNumber);
                    WriteRecordToFile(currentRow, writer, currentRowNum, totalRowCount);
                    currentRow.Clear();
                    currentRowNum++;
                }
            }

            return memory.ToArray();
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="record">List of cell values</param>
        /// <param name="sw">Open Writer to file</param>
        /// <param name="rowNumber">Current row num</param>
        /// <param name="totalRowCount"></param>
        /// <remarks>Avoiding writing final empty line so bulk import processes can work.</remarks>
        public static void WriteRecordToFile(List<string> record, StreamWriter sw, int rowNumber, int totalRowCount)
        {
            var commaDelimitedRecord = record.ToDelimitedString(",");

            if (rowNumber == totalRowCount)
            {
                sw.Write(commaDelimitedRecord);
            }
            else
            {
                sw.WriteLine(commaDelimitedRecord);
            }
        }

        public static void BuildRow(ExcelWorksheet worksheet, List<string> currentRow, int currentRowNum, int maxColumnNumber)
        {
            for (int i = 1; i <= maxColumnNumber; i++)
            {
                var cell = worksheet.Cells[currentRowNum, i];
                if (cell == null)
                {
                    // add a cell value for empty cells to keep data aligned.
                    AddCellValue(string.Empty, currentRow);
                }
                else
                {
                    AddCellValue(GetCellText(cell), currentRow);
                }
            }
        }

        /// <summary>
        /// Can't use .Text: http://epplus.codeplex.com/discussions/349696
        /// </summary>
        /// <param name="cell"></param>
        /// <returns></returns>
        private static string GetCellText(ExcelRangeBase cell)
        {
            return cell.Value == null ? string.Empty : cell.Value.ToString();
        }

        private static void AddCellValue(string s, List<string> record)
        {
            record.Add(string.Format("{0}{1}{0}", '"', s));
        }
    }
}
